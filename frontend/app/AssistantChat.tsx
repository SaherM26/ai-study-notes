"use client";

import { useEffect, useRef, useState } from "react";

type Message = {
    role: "user" | "assistant";
    content: string;
};

type AssistantChatProps = {
    material: string;
    sessionId: number;
};

type StudySession = {
    material?: string;
    result?: unknown;
    messages?: Message[];
};

const STORAGE_KEY = "studyai-session";

const suggestions = [
    "Explain simply",
    "Give an example",
    "Give key points",
    "Quiz me",
];

export default function AssistantChat({
    material,
    sessionId,
}: AssistantChatProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    /* RESTORE ASSISTANT MESSAGES*/

    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (!saved) return;

            const parsed: StudySession = JSON.parse(saved);

            if (Array.isArray(parsed.messages)) {
                setMessages(parsed.messages);
            }
        } catch (error) {
            console.error(
                "Failed to restore assistant conversation:",
                error
            );
        }
    }, [sessionId]);


    /*  SAVE ASSISTANT MESSAGES */
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            const currentSession: StudySession = saved
                ? JSON.parse(saved)
                : {};

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({
                    ...currentSession,
                    messages,
                })
            );
        } catch (error) {
            console.error(
                "Failed to save assistant conversation:",
                error
            );
        }
    }, [messages]);

    /* AUTO-SCROLL */

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth",
        });
    }, [messages, loading]);

    /* SEND MESSAGE*/

    const sendMessage = async (customQuestion?: string) => {
        const question = (customQuestion ?? input).trim();
        if (!question || loading) return;
        const userMessage: Message = {
            role: "user",
            content: question,
        };
        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        setInput("");
        setLoading(true);

        try {
            const response = await fetch("/api/assistant", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    material,
                    messages: updatedMessages,
                }),
            });

            let data: {
                answer?: string;
                error?: string;
            } | null = null;

            try {
                data = await response.json();
            } catch {
                data = null;
            }

            if (!response.ok) {
                throw new Error(
                    data?.error ||
                    "Failed to get assistant response."
                );
            }

            if (!data?.answer) {
                throw new Error(
                    "The assistant returned an empty response."
                );
            }

            setMessages([
                ...updatedMessages,
                {
                    role: "assistant",
                    content: data.answer,
                },
            ]);
        } catch (error) {
            console.error("Assistant error:", error);

            setMessages([
                ...updatedMessages,
                {
                    role: "assistant",
                    content:
                        error instanceof Error
                            ? error.message
                            : "Something went wrong. Please try again.",
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    /*  ENTER KEY  */

    const handleKeyDown = (
        event: React.KeyboardEvent<HTMLInputElement>
    ) => {
        if (event.key === "Enter") {
            event.preventDefault();
            sendMessage();
        }
    };
    return (
        <>
            {/* Assistant Trigger */}
            <button
                className="assistant-trigger"
                onClick={() => setIsOpen(!isOpen)}
            >🤖 AI Study Assistant
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="assistant-chat">
                    {/* Header */}
                    <div className="assistant-header">
                        <div>
                            <strong> AI Study Assistant</strong>
                            <span> Ask anything about your material</span>
                        </div>

                        <button
                            className="assistant-close"
                            onClick={() => setIsOpen(false)}
                            aria-label="Close assistant"
                        > × </button>
                    </div>

                    {/* Messages */}
                    <div className="assistant-messages">

                        {/* Welcome */}
                        {messages.length === 0 && !loading && (
                            <div className="assistant-welcome">

                                <div className="assistant-icon"> 🤖 </div>
                                <h3>  Hi! I&apos;m your Study Assistant.</h3>
                                <p>
                                    Ask me to explain a concept,
                                    simplify a topic, give an
                                    example, or quiz you on your
                                    material.
                                </p>

                                {/* Suggestions */}
                                <div className="assistant-suggestions">
                                    {suggestions.map(
                                        (suggestion) => (
                                            <button
                                                key={suggestion}
                                                onClick={() =>
                                                    sendMessage(
                                                        suggestion
                                                    )
                                                }
                                            >
                                                {suggestion}
                                            </button>
                                        )
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Conversation */}
                        {messages.map((message, index) => (
                            <div
                                key={index}
                                className={`assistant-message ${message.role === "user"
                                    ? "assistant-user"
                                    : "assistant-ai"
                                    }`}
                            >
                                {message.role === "assistant"
                                    ? formatAssistantMessage(
                                        message.content
                                    )
                                    : message.content}
                            </div>
                        ))}

                        {/* Typing Indicator */}
                        {loading && (
                            <div className="assistant-message assistant-ai assistant-thinking">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="assistant-input-area">
                        <input
                            type="text"
                            placeholder="Ask about your study material..."
                            value={input}
                            onChange={(event) =>
                                setInput(event.target.value)
                            }
                            onKeyDown={handleKeyDown}
                            disabled={loading}
                        />

                        <button
                            onClick={() => sendMessage()}
                            disabled={
                                loading || !input.trim()
                            }
                            aria-label="Send message"
                        >➤ </button>
                    </div>
                </div>
            )}
        </>
    );
}

/* FORMAT AI RESPONSES*/

function formatAssistantMessage(content: string) {
    const lines = content.split("\n");

    return (
        <div className="assistant-formatted">
            {lines.map((line, index) => {
                const trimmed = line.trim();

                if (!trimmed) {
                    return (
                        <div
                            key={index}
                            className="assistant-space"
                        />
                    );
                }

                /* Bullet points */
                if (
                    trimmed.startsWith("•") ||
                    trimmed.startsWith("-")
                ) {
                    const bulletText = trimmed
                        .replace(/^[-•]\s*/, "")
                        .trim();

                    return (
                        <div
                            key={index}
                            className="assistant-bullet"
                        >
                            <span>•</span>

                            <span>
                                {formatBoldText(
                                    bulletText
                                )}
                            </span>
                        </div>
                    );
                }

                return (
                    <p key={index}>
                        {formatBoldText(trimmed)}
                    </p>
                );
            })}
        </div>
    );
}

/*  BOLD TEXT SUPPORT*/

function formatBoldText(text: string) {
    const parts = text.split(/(\*\*.*?\*\*)/g);

    return parts.map((part, index) => {
        if (
            part.startsWith("**") &&
            part.endsWith("**")
        ) {
            return (
                <strong key={index}>
                    {part.slice(2, -2)}
                </strong>
            );
        }
        return <span key={index}>{part}</span>;
    });
}