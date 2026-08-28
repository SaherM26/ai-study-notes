import { NextResponse } from "next/server";
import { CanvasFactory } from "pdf-parse/worker";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import { createWorker } from "tesseract.js";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";

export const runtime = "nodejs";

const MIN_USEFUL_TEXT_LENGTH = 100;
const MAX_OCR_PAGES = 20;

// OCR (tesseract) is the most expensive operation in this app — keep
// this tight. Regular PDF/DOCX/TXT parsing is cheap, but this limit
// applies to the whole route since we don't know which path a request
// will take until after parsing starts.
const RATE_LIMIT = 8;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

// Languages supported by our OCR fallback.
// Tesseract will download the required language data when needed.
const OCR_LANGUAGES = "eng+ara+hin+mar+urd";

function hasUsefulText(text: string): boolean {
    const cleaned = text
        .replace(/\s+/g, " ")
        .trim();

    if (cleaned.length < MIN_USEFUL_TEXT_LENGTH) {
        return false;
    }

    // Ignore PDFs that contain mostly URLs/page markers.
    const words = cleaned
        .split(/\s+/)
        .filter((word) => word.length > 1);

    if (words.length < 20) {
        return false;
    }

    const meaningfulCharacters = cleaned.replace(
        /[\s\d.,:;!?()[\]{}'"`_\-=/\\|<>@#$%^&*+~]+/g,
        ""
    );

    return meaningfulCharacters.length >= 50;
}

async function ocrPdfPages(
    parser: PDFParse,
    pageCount: number
): Promise<string> {
    const pagesToProcess = Math.min(pageCount, MAX_OCR_PAGES);

    console.log(
        `OCR fallback started. Processing ${pagesToProcess} of ${pageCount} pages.`
    );

    const worker = await createWorker(OCR_LANGUAGES, 1, {
        logger: (message) => {
            if (
                message.status === "recognizing text" &&
                typeof message.progress === "number"
            ) {
                console.log(
                    `OCR progress: ${Math.round(message.progress * 100)}%`
                );
            }
        },
    });

    try {
        const screenshotResult = await parser.getScreenshot({
            scale: 1.5,
            first: 1,
            last: pagesToProcess,
        });

        const ocrResults: string[] = [];

        for (const page of screenshotResult.pages) {
            try {
                const { data } = await worker.recognize(Buffer.from(page.data));

                if (data.text && data.text.trim()) {
                    ocrResults.push(data.text.trim());
                }
            } catch (pageError) {
                console.error("OCR page error:", pageError);
            }
        }

        return ocrResults.join("\n\n");
    } finally {
        await worker.terminate();
    }
}

export async function POST(request: Request) {
    try {
        const clientIp = getClientIp(request);

        if (isRateLimited(clientIp, RATE_LIMIT, RATE_LIMIT_WINDOW_MS)) {
            return NextResponse.json(
                {
                    error:
                        "Too many uploads. Please wait a moment before trying again.",
                },
                { status: 429 }
            );
        }

        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json(
                { error: "No file uploaded" },
                { status: 400 }
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = file.name.toLowerCase();

        let text = "";
        let usedOCR = false;

        /*
         * PDF
         */
        if (fileName.endsWith(".pdf")) {
            let parser: PDFParse | null = null;

            try {
                parser = new PDFParse({
                    data: buffer,
                    CanvasFactory,
                });

                const result = await parser.getText();
                text = result.text || "";

                console.log(
                    `PDF extracted text length: ${text.length}`
                );

                /*
                 * If normal PDF extraction gives useful text,
                 * don't run OCR. This is much faster.
                 */
                if (!hasUsefulText(text)) {
                    console.log(
                        "Little/no useful PDF text detected. Starting OCR..."
                    );

                    const info = await parser.getInfo();

                    const pageCount =
                        info.total ||
                        result.total ||
                        1;

                    text = await ocrPdfPages(
                        parser,
                        pageCount
                    );

                    usedOCR = true;

                    console.log(
                        `OCR extracted text length: ${text.length}`
                    );
                }
            } catch (pdfError) {
                console.error(
                    "PDF processing error:",
                    pdfError
                );

                throw new Error(
                    "Unable to read this PDF file."
                );
            } finally {
                if (parser) {
                    await parser.destroy();
                }
            }
        }

        /*
         * DOCX
         */
        else if (fileName.endsWith(".docx")) {
            try {
                const result =
                    await mammoth.extractRawText({
                        buffer,
                    });

                text = result.value || "";

                if (!hasUsefulText(text)) {
                    return NextResponse.json(
                        {
                            error:
                                "This DOCX file does not contain enough readable text.",
                        },
                        { status: 400 }
                    );
                }
            } catch (docxError) {
                console.error(
                    "DOCX parsing error:",
                    docxError
                );

                throw new Error(
                    "Unable to read this DOCX file."
                );
            }
        }

        /*
         * Legacy DOC
         */
        else if (fileName.endsWith(".doc")) {
            try {
                /*
                 * word-extractor is loaded dynamically because it
                 * is a CommonJS Node package.
                 */
                const WordExtractor =
                    (await import("word-extractor"))
                        .default;

                const extractor =
                    new WordExtractor();

                const document =
                    await extractor.extract(buffer);

                text = document.getBody() || "";

                if (!hasUsefulText(text)) {
                    return NextResponse.json(
                        {
                            error:
                                "This DOC file does not contain enough readable text.",
                        },
                        { status: 400 }
                    );
                }
            } catch (docError) {
                console.error(
                    "DOC parsing error:",
                    docError
                );

                throw new Error(
                    "Unable to read this DOC file."
                );
            }
        }

        /*
         * TXT
         */
        else if (fileName.endsWith(".txt")) {
            text = buffer.toString("utf-8");
        }

        /*
         * Unsupported file
         */
        else {
            return NextResponse.json(
                {
                    error:
                        "Only PDF, DOC, DOCX, and TXT files are supported.",
                },
                { status: 400 }
            );
        }

        text = text.trim();

        if (!text) {
            return NextResponse.json(
                {
                    error:
                        "No readable text was found in this file.",
                },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            fileName: file.name,
            text,
            usedOCR,
        });
    } catch (error) {
        console.error("Upload error:", error);

        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to process the file",
            },
            { status: 500 }
        );
    }
}