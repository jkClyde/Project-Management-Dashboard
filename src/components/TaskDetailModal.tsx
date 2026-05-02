"use client";

import { useState, useRef, useEffect } from "react";
import {
    X,
    ChevronDown,
    Check,
    MessageSquare,
    Send,
    Trash2,
    AlertTriangle,
} from "lucide-react";
import { TaskDetail, TaskStatus, TaskPriority } from "../../types/task";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
    task: TaskDetail | null;
    open: boolean;
    onClose: () => void;
    onUpdate: (id: string, updates: Partial<TaskDetail>) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
    onAddComment: (id: string, body: string) => Promise<void>;
    onDeleteComment: (id: string, commentId: string) => Promise<void>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
    { value: "todo",        label: "To Do" },
    { value: "in_progress", label: "In Progress" },
    { value: "done",        label: "Done" },
];

// Priority colors are intentionally semantic/fixed — they communicate urgency
// universally and aren't part of the site's theme palette.
const PRIORITY_META: Record<TaskPriority, { label: string; textCls: string; bgCls: string; borderCls: string }> = {
    low:    { label: "LOW",    textCls: "text-sky-500",    bgCls: "bg-sky-500/10",    borderCls: "border-sky-500/30" },
    medium: { label: "MEDIUM", textCls: "text-yellow-500", bgCls: "bg-yellow-500/10", borderCls: "border-yellow-500/30" },
    high:   { label: "HIGH",   textCls: "text-orange-500", bgCls: "bg-orange-500/10", borderCls: "border-orange-500/30" },
    urgent: { label: "URGENT", textCls: "text-red-500",    bgCls: "bg-red-500/10",    borderCls: "border-red-500/30" },
};

function getInitials(name?: string | null) {
    if (!name) return "?";
    return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function formatDate(iso?: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TaskDetailModal({
    task,
    open,
    onClose,
    onUpdate,
    onDelete,
    onAddComment,
    onDeleteComment,
}: Props) {
    const [commentInput, setCommentInput] = useState("");
    const [submitting, setSubmitting]     = useState(false);
    const [statusOpen, setStatusOpen]     = useState(false);
    const statusRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handler(e: MouseEvent) {
            if (statusRef.current && !statusRef.current.contains(e.target as Node)) {
                setStatusOpen(false);
            }
        }
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    if (!open || !task) return null;

    const pm = PRIORITY_META[task.priority];
    const isOverdue = (d?: string | null) =>
        !!d && new Date(d) < new Date() && task.status !== "done";

    async function handleStatusChange(status: TaskStatus) {
        setStatusOpen(false);
        await onUpdate(task!.id, { status });
    }

    async function handleCommentSubmit() {
        if (!commentInput.trim()) return;
        setSubmitting(true);
        try {
            await onAddComment(task!.id, commentInput.trim());
            setCommentInput("");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        /* ── Backdrop ── */
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            {/* ── Modal shell ── */}
            <div
                className="relative w-full max-w-5xl mx-4 rounded-xl overflow-hidden flex flex-col bg-card border border-border shadow-2xl"
                style={{ maxHeight: "90vh" }}
            >
                {/* ── Top bar ── */}
                <div className="flex items-center gap-3 px-5 py-3 border-b border-border shrink-0">

                    {/* Priority badge */}
                    <span className={`text-xs font-semibold px-3 py-1 rounded border tracking-wide ${pm.textCls} ${pm.bgCls} ${pm.borderCls}`}>
                         {pm.label}
                    </span>

                    {/* Status dropdown */}
                    <div className="relative" ref={statusRef}>
                        <button
                            onClick={() => setStatusOpen((v) => !v)}
                            className="flex items-center gap-2 px-4 py-1.5 rounded text-sm font-medium bg-muted hover:bg-accent text-foreground border border-border transition-colors"
                        >
                            {STATUS_OPTIONS.find((s) => s.value === task.status)?.label ?? "—"}
                            <ChevronDown size={14} className="text-muted-foreground" />
                        </button>

                        {statusOpen && (
                            <div className="absolute top-full left-0 mt-1 z-10 rounded-lg overflow-hidden w-44 bg-popover border border-border shadow-lg">
                                {STATUS_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.value}
                                        onClick={() => handleStatusChange(opt.value)}
                                        className={`flex items-center justify-between w-full px-4 py-2.5 text-sm transition-colors hover:bg-accent ${
                                            task.status === opt.value
                                                ? "text-primary font-medium"
                                                : "text-muted-foreground"
                                        }`}
                                    >
                                        {opt.label}
                                        {task.status === opt.value && <Check size={13} />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Mark done shortcut */}
                    {task.status !== "done" && (
                        <button
                            onClick={() => onUpdate(task.id, { status: "done" })}
                            title="Mark as done"
                            className="flex items-center justify-center w-8 h-8 rounded text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                        >
                            <Check size={16} />
                        </button>
                    )}

                    <div className="flex-1" />

                    {/* Delete */}
                    <button
                        onClick={() => onDelete(task.id)}
                        title="Delete task"
                        className="flex items-center justify-center w-8 h-8 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                        <Trash2 size={15} />
                    </button>

                    {/* Close */}
                    <button
                        onClick={onClose}
                        className="flex items-center justify-center w-8 h-8 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* ── Body: two-column ── */}
                <div className="flex flex-1 overflow-hidden min-h-0">

                    {/* ── Left: task details ── */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-5 border-r border-border">

                        {/* Task Name */}
                        <Field label="Task Name">
                            <p className="text-sm font-medium text-foreground">{task.title}</p>
                        </Field>

                        {/* Project */}
                        <Field label="Project">
                            <div className="flex items-center gap-2">
                                <span
                                    className="w-2.5 h-2.5 rounded-sm shrink-0"
                                    style={{ backgroundColor: task.projectColor }}
                                />
                                <p className="text-sm text-foreground">{task.projectName}</p>
                            </div>
                        </Field>

                        {/* Description */}
                        <div>
                            <label className="block text-xs text-muted-foreground mb-2">
                                Description
                            </label>
                            <div className="rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap min-h-[120px] bg-muted/40 border border-border text-foreground">
                                {task.description || (
                                    <span className="text-muted-foreground italic">
                                        No description provided.
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Dates row */}
                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Created">
                                <p className="text-sm text-foreground">{formatDate(task.createdAt)}</p>
                            </Field>
                            <Field label="Due Date">
                                {task.dueDate ? (
                                    <p className={`text-sm flex items-center gap-1 ${
                                        isOverdue(task.dueDate) ? "text-destructive" : "text-foreground"
                                    }`}>
                                        {isOverdue(task.dueDate) && <AlertTriangle size={12} />}
                                        {formatDate(task.dueDate)}
                                    </p>
                                ) : (
                                    <p className="text-sm text-muted-foreground">—</p>
                                )}
                            </Field>
                        </div>

                        {/* Assignee */}
                        <Field label="Assignee">
                            {task.assignee ? (
                                <div className="flex items-center gap-2 mt-0.5">
                                    {task.assignee.avatarUrl ? (
                                        <img
                                            src={task.assignee.avatarUrl}
                                            alt={task.assignee.fullName ?? ""}
                                            className="w-6 h-6 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground shrink-0">
                                            {getInitials(task.assignee.fullName)}
                                        </div>
                                    )}
                                    <span className="text-sm text-foreground">
                                        {task.assignee.fullName ?? task.assignee.email ?? "—"}
                                    </span>
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">Unassigned</p>
                            )}
                        </Field>
                    </div>

                    {/* ── Right: comments ── */}
                    <div className="w-80 shrink-0 flex flex-col min-h-0" style={{ minWidth: 280 }}>

                        {/* Comment list */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {(!task.comments || task.comments.length === 0) ? (
                                <div className="flex flex-col items-center justify-center h-full py-12 text-center rounded-xl bg-muted/30 border border-border">
                                    <MessageSquare size={20} className="text-muted-foreground mb-2" />
                                    <p className="text-sm text-muted-foreground">No comments found.</p>
                                </div>
                            ) : (
                                task.comments.map((c) => (
                                    <div
                                        key={c.id}
                                        className="group relative rounded-xl p-3 text-sm bg-muted/40 border border-border"
                                    >
                                        <div className="flex items-center gap-2 mb-1.5">
                                            {c.author.avatarUrl ? (
                                                <img
                                                    src={c.author.avatarUrl}
                                                    alt={c.author.fullName ?? ""}
                                                    className="w-6 h-6 rounded-full object-cover shrink-0"
                                                />
                                            ) : (
                                                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground shrink-0">
                                                    {getInitials(c.author.fullName)}
                                                </div>
                                            )}
                                            <span className="text-xs text-muted-foreground">
                                                {c.author.fullName ?? c.author.email ?? "Unknown"}
                                            </span>
                                            <span className="ml-auto text-xs text-muted-foreground/60">
                                                {formatDate(c.createdAt)}
                                            </span>
                                        </div>
                                        <p className="text-foreground leading-relaxed">{c.body}</p>

                                        <button
                                            onClick={() => onDeleteComment(task.id, c.id)}
                                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Comment input */}
                        <div className="p-3 border-t border-border shrink-0">
                            <div className="relative">
                                <textarea
                                    rows={3}
                                    placeholder="Type your comment..."
                                    value={commentInput}
                                    onChange={(e) => setCommentInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleCommentSubmit();
                                    }}
                                    className="w-full resize-none rounded-lg px-4 py-3 pr-12 text-sm bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring transition-colors"
                                />
                                <button
                                    onClick={handleCommentSubmit}
                                    disabled={!commentInput.trim() || submitting}
                                    className="absolute bottom-3 right-3 flex items-center justify-center w-7 h-7 rounded-lg bg-primary text-primary-foreground transition-all disabled:opacity-30 hover:opacity-90"
                                >
                                    <Send size={13} />
                                </button>
                            </div>
                            <p className="text-xs mt-1.5 text-muted-foreground/50">⌘ + Enter to send</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-xs text-muted-foreground mb-1">{label}</label>
            <div>{children}</div>
        </div>
    );
}