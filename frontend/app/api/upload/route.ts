import { NextResponse } from "next/server";
import { CanvasFactory } from "pdf-parse/worker";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

export async function POST(request: Request) {
    try {
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

        if (fileName.endsWith(".pdf")) {
            try {
                const parser = new PDFParse({
                    data: buffer,
                    CanvasFactory,
                });

                const result = await parser.getText();
                text = result.text;

                await parser.destroy();
            } catch (pdfError) {
                console.error("PDF parsing error:", pdfError);
                throw new Error("Unable to read this PDF file.");
            }
        } else if (fileName.endsWith(".docx")) {
            const result = await mammoth.extractRawText({ buffer });
            text = result.value;
        } else if (fileName.endsWith(".txt")) {
            text = buffer.toString("utf-8");
        } else {
            return NextResponse.json(
                {
                    error: "Only PDF, DOCX, and TXT files are supported",
                },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            fileName: file.name,
            text,
        });
    } catch (error) {
        console.error("Upload error:", error);

        return NextResponse.json(
            { error: "Failed to process the file" },
            { status: 500 }
        );
    }
}