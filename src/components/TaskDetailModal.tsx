"use client";

import { useState, useTransition } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Calendar,
    Flag,
    User,
    AlignLeft,
    Send,
    Trash2,
    Pencil,
    X,
    Check,
    MessageSquare,
    Clock,
} from "lucide-react";

import {
    TaskDetail,
    TaskStatus,
    TaskPriority,
    TaskMember,
} from "../../types/task";

// ─── Config ─────────────────────────────────

const STATUS_OPTIONS: { value: TaskStatus; label: string; cls: string }[] = [
    { value: "todo", label: "To Do", cls: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
    { value: "in_progress", label: "In Progress", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    { value: "done", label: "Done", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
];

const PRIORITY_OPTIONS: { value: TaskPriority; label: string; textCls: string; dot: string }[] = [
    { value: "low", label: "Low", textCls: "text-sky-400", dot: "bg-sky-400" },
    { value: "medium", label: "Medium", textCls: "text-yellow-400", dot: "bg-yellow-400" },
    { value: "high", label: "High", textCls: "text-orange-400", dot: "bg-orange-400" },
    { value: "urgent", label: "Urgent", textCls: "text-red-400", dot: "bg-red-400" },
];

// ─── Helpers ─────────────────────────────────

function getInitials(name?: string | null) {
    if (!name) return "?";
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
    });
}

// ─── Props ─────────────────────────────────

interface TaskDetailModalProps {
    task: TaskDetail | null;
    open: boolean;
    onClose: () => void;
    members?: TaskMember[];
    onUpdate: (taskId: string, updates: Partial<Omit<TaskDetail, "comments">>) => Promise<void>;
    onDelete: (taskId: string) => Promise<void>;
    onAddComment: (taskId: string, body: string) => Promise<void>;
    onDeleteComment: (taskId: string, commentId: string) => Promise<void>;
}

// ─── Component ──────────────────────────────

export default function TaskDetailModal({
    task,
    open,
    onClose,
    members = [],
    onUpdate,
    onDelete,
    onAddComment,
    onDeleteComment,
}: TaskDetailModalProps) {
    const [, startTransition] = useTransition();

    const [editingTitle, setEditingTitle] = useState(false);
    const [titleDraft, setTitleDraft] = useState("");
    const [editingDesc, setEditingDesc] = useState(false);
    const [descDraft, setDescDraft] = useState("");
    const [commentBody, setCommentBody] = useState("");
    const [submittingComment, setSubmittingComment] = useState(false);

    if (!task) return null;

    // ✅ FIX: lock non-null value
    const currentTask = task;

    const isOverdue =
        currentTask.dueDate &&
        new Date(currentTask.dueDate) < new Date() &&
        currentTask.status !== "done";

    // ── Handlers ──────────────────────────────

    function update<K extends keyof Omit<TaskDetail, "comments">>(
        key: K,
        value: TaskDetail[K]
    ) {
        startTransition(() => {
            onUpdate(currentTask.id, { [key]: value });
        });
    }

    function saveTitleEdit() {
        if (titleDraft.trim() && titleDraft.trim() !== currentTask.title) {
            update("title", titleDraft.trim());
        }
        setEditingTitle(false);
    }

    function saveDescEdit() {
        if (descDraft !== (currentTask.description ?? "")) {
            update("description", descDraft || null);
        }
        setEditingDesc(false);
    }

    async function submitComment() {
        if (!commentBody.trim()) return;
        setSubmittingComment(true);
        await onAddComment(currentTask.id, commentBody.trim());
        setCommentBody("");
        setSubmittingComment(false);
    }

    function handleDelete() {
        if (!confirm("Delete this task? This cannot be undone.")) return;
        startTransition(async () => {
            await onDelete(currentTask.id);
            onClose();
        });
    }

    // ── Render ────────────────────────────────

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">

                <div className="h-1 w-full" style={{ backgroundColor: currentTask.projectColor }} />

                <DialogHeader className="px-6 pt-5 pb-0">

                    {/* TITLE */}
                    {editingTitle ? (
                        <div className="flex items-center gap-2">
                            <Input
                                value={titleDraft}
                                onChange={(e) => setTitleDraft(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") saveTitleEdit();
                                    if (e.key === "Escape") setEditingTitle(false);
                                }}
                                autoFocus
                            />
                            <Button size="icon" variant="ghost" onClick={saveTitleEdit}>
                                <Check size={13} />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => setEditingTitle(false)}>
                                <X size={13} />
                            </Button>
                        </div>
                    ) : (
                        <div onClick={() => {
                            setTitleDraft(currentTask.title);
                            setEditingTitle(true);
                        }}>
                            <DialogTitle>{currentTask.title}</DialogTitle>
                        </div>
                    )}

                    <div className="flex justify-between mt-2 pb-4 border-b">
                        <span>{currentTask.projectName}</span>
                        <Button variant="ghost" onClick={handleDelete}>
                            <Trash2 size={12} /> Delete
                        </Button>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

                    {/* STATUS */}
                    <Select
                        value={currentTask.status}
                        onValueChange={(v) => update("status", v as TaskStatus)}
                    >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {STATUS_OPTIONS.map((s) => (
                                <SelectItem key={s.value} value={s.value}>
                                    {s.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* DESCRIPTION */}
                    <Textarea
                        value={editingDesc ? descDraft : currentTask.description ?? ""}
                        onChange={(e) => setDescDraft(e.target.value)}
                    />

                    {/* COMMENTS */}
                    {currentTask.comments.map((c) => (
                        <div key={c.id}>{c.body}</div>
                    ))}

                    <Textarea
                        placeholder="Write a comment…"
                        value={commentBody}
                        onChange={(e) => setCommentBody(e.target.value)}
                    />

                    <Button
                        onClick={submitComment}
                        disabled={!commentBody.trim() || submittingComment}
                    >
                        <Send size={12} /> Comment
                    </Button>

                </div>
            </DialogContent>
        </Dialog>
    );
}