"use client";

import { useState, useRef, useEffect } from "react";
import { Textarea } from "./Textarea";
import { cn } from "../../lib/utils";
import { usePatients } from "../../hooks/usePatients";
import { api } from "../../lib/api";
import {
    ArrowUpIcon,
    Paperclip,
    PlusIcon,
    Bot,
    User
} from "lucide-react";
import useAutoResizeTextarea from "../../hooks/useAutoResizeTextarea";

export function VercelV0Chat() {
    const [value, setValue] = useState("");
    const [messages, setMessages] = useState([
        {
            role: "assistant",
            text: "Hello! I am your supportive developmental screening assistant. Ask me questions about parenting, early intervention, or your child's latest screening assessments."
        }
    ]);
    const [sending, setSending] = useState(false);
    const { activePatient } = usePatients();
    const chatEndRef = useRef(null);

    const { textareaRef, adjustHeight } = useAutoResizeTextarea({
        minHeight: 60,
        maxHeight: 200,
    });

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async () => {
        const query = value.trim();
        if (!query || sending) return;

        if (!activePatient?.id) {
            setMessages((prev) => [
                ...prev,
                { role: "user", text: query },
                { role: "assistant", text: "Please select or add a child profile from the dashboard to enable personalized AI recommendations based on their assessments." }
            ]);
            setValue("");
            adjustHeight(true);
            return;
        }

        setValue("");
        adjustHeight(true);
        setSending(true);

        // Add user message to history
        setMessages((prev) => [...prev, { role: "user", text: query }]);

        try {
            const data = await api("/ai/suggestions", {
                method: "POST",
                body: JSON.stringify({
                    childId: activePatient.id,
                    query: query
                })
            });
            setMessages((prev) => [...prev, { role: "assistant", text: data.reply }]);
        } catch (err) {
            console.error("AI chat error:", err);
            setMessages((prev) => [
                ...prev,
                { role: "assistant", text: "Sorry, I encountered an issue connecting to the AI recommendations engine. Please make sure the backend server is running and try again." }
            ]);
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="flex flex-col w-full max-w-4xl mx-auto h-[600px] border rounded-3xl overflow-hidden" style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
            {/* Header info */}
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--card-border)" }}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                        <Bot className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Developmental Screening Assistant</h2>
                        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                            {activePatient ? `Analyzing development for ${activePatient.name}` : "General advice mode"}
                        </p>
                    </div>
                </div>
                {activePatient && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/20">
                        {activePatient.name} Selected
                    </span>
                )}
            </div>

            {/* Message history */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={cn(
                            "flex items-start gap-4 max-w-[80%]",
                            msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                        )}
                    >
                        <div
                            className={cn(
                                "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 border",
                                msg.role === "user"
                                    ? "bg-blue-500/15 text-blue-400 border-blue-500/20"
                                    : "bg-teal-500/15 text-teal-400 border-teal-500/20"
                            )}
                        >
                            {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                        </div>
                        <div
                            className={cn(
                                "rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap border",
                                msg.role === "user"
                                    ? "bg-blue-500/5 text-blue-200 border-blue-500/15"
                                    : "bg-white/[0.02] text-neutral-200 border-white/[0.08]"
                            )}
                        >
                            {msg.text}
                        </div>
                    </div>
                ))}
                {sending && (
                    <div className="space-y-3 animate-pulse">
                        <div className="flex items-start gap-4 max-w-[80%] mr-auto">
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 border bg-teal-500/15 text-teal-400 border-teal-500/20">
                                <Bot className="w-4 h-4" />
                            </div>
                            <div className="rounded-2xl px-4 py-3 border bg-white/[0.02] border-white/[0.08] space-y-2">
                                <div className="h-3 w-64 rounded" style={{ background: "var(--hover-bg)" }} />
                                <div className="h-3 w-48 rounded" style={{ background: "var(--hover-bg)" }} />
                                <div className="h-3 w-56 rounded" style={{ background: "var(--hover-bg)" }} />
                            </div>
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            {/* Input area */}
            <div className="p-4 border-t" style={{ borderColor: "var(--card-border)" }}>
                <div className="relative rounded-xl border bg-white/[0.01]" style={{ borderColor: "var(--card-border)" }}>
                    <div className="overflow-y-auto">
                        <Textarea
                            ref={textareaRef}
                            value={value}
                            onChange={(e) => {
                                setValue(e.target.value);
                                adjustHeight();
                            }}
                            onKeyDown={handleKeyDown}
                            placeholder={activePatient ? `Ask about ${activePatient.name}'s progress...` : "Ask a question..."}
                            className={cn(
                                "w-full px-4 py-3",
                                "resize-none",
                                "bg-transparent",
                                "border-none",
                                "text-sm",
                                "focus:outline-none",
                                "focus-visible:ring-0 focus-visible:ring-offset-0",
                                "placeholder:text-neutral-500 placeholder:text-sm",
                                "min-h-[60px]"
                            )}
                            style={{
                                overflow: "hidden",
                                color: "var(--text-primary)"
                            }}
                            disabled={sending}
                        />
                    </div>

                    <div className="flex items-center justify-between p-3 border-t" style={{ borderColor: "var(--card-border)" }}>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                className="group p-2 rounded-lg transition-colors flex items-center gap-1 hover:bg-white/5"
                                disabled={sending}
                            >
                                <Paperclip className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
                                <span className="text-xs text-neutral-400 hidden group-hover:inline transition-opacity">
                                    Attach
                                </span>
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                className="px-2 py-1 rounded-lg text-sm text-zinc-400 transition-colors border border-dashed border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800 flex items-center justify-between gap-1"
                                disabled={sending}
                            >
                                <PlusIcon className="w-4 h-4" />
                                Project
                            </button>
                            <button
                                type="button"
                                onClick={handleSendMessage}
                                className={cn(
                                    "px-1.5 py-1.5 rounded-lg text-sm transition-colors border hover:bg-zinc-800 flex items-center justify-between gap-1 cursor-pointer",
                                    value.trim() && !sending
                                        ? "bg-blue-500 text-white border-blue-600"
                                        : "text-zinc-400 border-transparent"
                                )}
                                disabled={!value.trim() || sending}
                            >
                                <ArrowUpIcon className="w-4 h-4" />
                                <span className="sr-only">Send</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
