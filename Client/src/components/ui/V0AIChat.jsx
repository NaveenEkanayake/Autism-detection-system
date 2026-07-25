"use client";

import { useState } from "react";
import { Textarea } from "./Textarea";
import { cn } from "../../lib/utils";
import {
    ImageIcon,
    FileUp,
    MonitorIcon,
    CircleUserRound,
    ArrowUpIcon,
    Paperclip,
    PlusIcon,
} from "lucide-react";
import useAutoResizeTextarea from "../../hooks/useAutoResizeTextarea";

export function VercelV0Chat() {
    const [value, setValue] = useState("");
    const { textareaRef, adjustHeight } = useAutoResizeTextarea({
        minHeight: 60,
        maxHeight: 200,
    });

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (value.trim()) {
                setValue("");
                adjustHeight(true);
            }
        }
    };

    return (
        <div className="flex flex-col items-center w-full max-w-4xl mx-auto p-4 space-y-8">
            <h1 className="text-4xl font-bold" style={{ color: "var(--text-primary)" }}>
                What can I help you ship?
            </h1>

            <div className="w-full">
                <div className="relative rounded-xl border" style={{ background: "var(--sidebar-bg)", borderColor: "var(--sidebar-border)" }}>
                    <div className="overflow-y-auto">
                        <Textarea
                            ref={textareaRef}
                            value={value}
                            onChange={(e) => {
                                setValue(e.target.value);
                                adjustHeight();
                            }}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask v0 a question..."
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
                        />
                    </div>

                    <div className="flex items-center justify-between p-3 border-t" style={{ borderColor: "var(--sidebar-border)" }}>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                className="group p-2 rounded-lg transition-colors flex items-center gap-1 hover:bg-white/5"
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
                            >
                                <PlusIcon className="w-4 h-4" />
                                Project
                            </button>
                            <button
                                type="button"
                                className={cn(
                                    "px-1.5 py-1.5 rounded-lg text-sm transition-colors border hover:bg-zinc-800 flex items-center justify-between gap-1",
                                    value.trim()
                                        ? "bg-white text-black"
                                        : "text-zinc-400"
                                )}
                            >
                                <ArrowUpIcon className="w-4 h-4" />
                                <span className="sr-only">Send</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-center gap-3 mt-4">
                    <ActionButton icon={<ImageIcon className="w-4 h-4" />} label="Clone a Screenshot" />
                    <ActionButton icon={<FileUp className="w-4 h-4" />} label="Upload a Project" />
                    <ActionButton icon={<MonitorIcon className="w-4 h-4" />} label="Landing Page" />
                    <ActionButton icon={<CircleUserRound className="w-4 h-4" />} label="Sign Up Form" />
                </div>
            </div>
        </div>
    );
}

function ActionButton({ icon, label }) {
    return (
        <button
            type="button"
            className="flex items-center gap-2 px-4 py-2 rounded-full border transition-colors"
            style={{ background: "var(--card-bg)", borderColor: "var(--card-border)", color: "var(--text-secondary)" }}
        >
            {icon}
            <span className="text-xs">{label}</span>
        </button>
    );
}
