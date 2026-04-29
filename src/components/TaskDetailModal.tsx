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
import { TaskDetail, TaskStatus, TaskPriority, TaskMember } from "./types";

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: TaskStatus; label: string; cls: string }[] = [
    { value: "todo",        label: "To Do",       cls: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
    { value: "in_progress", label: "In Progress", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    { value: "done",        label: "Done",        cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
];

const PRIORITY_OPTIONS: { value: TaskPriority; label: string; textCls: string; dot: string }[] = [
    { value: "low",    label: "Low",    textCls: "text-sky-400",    dot: "bg-sky-400" },
    { value: "medium", label: "Medium", textCls: "text-yellow-400", dot: "bg-yellow-400" },
    { value: "high",   label: "High",   textCls: "text-orange-400", dot: "bg-orange-400" },
    { value: "urgent", label: "Urgent", textCls: "text-red-400",    dot: "bg-red-400" },
];

function getInitials(name?: string | null) {
    if (!name) return "?";
    return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric",
    });
}

function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString("en-US", {
        hour: "numeric", minute: "2-digit",
    });
}

// ─── Props ────────────────────────────────────────────────────────────────────

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

// ─── Component ────────────────────────────────────────────────────────────────

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

    const isOverdue =
        task.dueDate &&
        new Date(task.dueDate) < new Date() &&
        task.status !== "done";

    // ── Handlers ────────────────────────────────────────────────────────────────

    function update<K extends keyof Omit<TaskDetail, "comments">>(key: K, value: TaskDetail[K]) {
        startTransition(() => { onUpdate(task!.id, { [key]: value }); });
    }

    function saveTitleEdit() {
        if (titleDraft.trim() && titleDraft.trim() !== task.title) {
            update("title", titleDraft.trim());
        }
        setEditingTitle(false);
    }

    function saveDescEdit() {
        if (descDraft !== (task.description ?? "")) {
            update("description", descDraft || null);
        }
        setEditingDesc(false);
    }

    async function submitComment() {
        if (!commentBody.trim()) return;
        setSubmittingComment(true);
        await onAddComment(task!.id, commentBody.trim());
        setCommentBody("");
        setSubmittingComment(false);
    }

    function handleDelete() {
        if (!confirm("Delete this task? This cannot be undone.")) return;
        startTransition(async () => {
            await onDelete(task!.id);
            onClose();
        });
    }

    // ── Render ──────────────────────────────────────────────────────────────────

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">

                {/* Project color stripe */}
                <div className="h-1 w-full shrink-0" style={{ backgroundColor: task.projectColor }} />

                {/* Header */}
                <DialogHeader className="px-6 pt-5 pb-0 shrink-0">
                    {/* Title row */}
                    {editingTitle ? (
                        <div className="flex items-center gap-2">
                            <Input
                                value={titleDraft}
                                onChange={(e) => setTitleDraft(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") saveTitleEdit();
                                    if (e.key === "Escape") setEditingTitle(false);
                                }}
                                className="text-base font-semibold h-8 flex-1"
                                autoFocus
                            />
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={saveTitleEdit}>
                                <Check size={13} />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingTitle(false)}>
                                <X size={13} />
                            </Button>
                        </div>
                    ) : (
                        <div
                            className="flex items-start gap-2 group cursor-pointer pr-8"
                            onClick={() => { setTitleDraft(task.title); setEditingTitle(true); }}
                        >
                            <DialogTitle className="text-base font-semibold leading-snug flex-1">
                                {task.title}
                            </DialogTitle>
                            <Pencil
                                size={12}
                                className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1 shrink-0"
                            />
                        </div>
                    )}

                    {/* Project + delete row */}
                    <div className="flex items-center justify-between mt-2 pb-4 border-b border-border/50">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: task.projectColor }} />
                            <span className="text-xs text-muted-foreground">{task.projectName}</span>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-muted-foreground hover:text-destructive gap-1.5"
                            onClick={handleDelete}
                        >
                            <Trash2 size={12} /> Delete task
                        </Button>
                    </div>
                </DialogHeader>

                {/* Scrollable body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

                    {/* ── Meta fields ── */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-4">

                        {/* Status */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                <Check size={11} /> Status
                            </label>
                            <Select value={task.status} onValueChange={(v) => update("status", v as TaskStatus)}>
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {STATUS_OPTIONS.map((s) => (
                                        <SelectItem key={s.value} value={s.value} className="text-xs">
                                            <Badge variant="outline" className={`text-[10px] ${s.cls}`}>{s.label}</Badge>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Priority */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                <Flag size={11} /> Priority
                            </label>
                            <Select value={task.priority} onValueChange={(v) => update("priority", v as TaskPriority)}>
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {PRIORITY_OPTIONS.map((p) => (
                                        <SelectItem key={p.value} value={p.value} className="text-xs">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${p.dot}`} />
                                                <span className={p.textCls}>{p.label}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Assignee */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                <User size={11} /> Assignee
                            </label>
                            <Select
                                value={task.assignee?.id ?? "unassigned"}
                                onValueChange={(v) =>
                                    update("assignee", v === "unassigned" ? null : (members.find((m) => m.id === v) ?? null))
                                }
                            >
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="Unassigned" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="unassigned" className="text-xs text-muted-foreground">
                                        Unassigned
                                    </SelectItem>
                                    {members.map((m) => (
                                        <SelectItem key={m.id} value={m.id} className="text-xs">
                                            <div className="flex items-center gap-2">
                                                <Avatar className="w-4 h-4">
                                                    <AvatarImage src={m.avatarUrl ?? undefined} />
                                                    <AvatarFallback className="text-[8px]">{getInitials(m.fullName)}</AvatarFallback>
                                                </Avatar>
                                                {m.fullName ?? m.email ?? "Unknown"}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Due date */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                <Calendar size={11} /> Due date
                                {isOverdue && (
                                    <span className="text-[10px] text-red-400 flex items-center gap-0.5 ml-1">
                    <Clock size={9} /> Overdue
                  </span>
                                )}
                            </label>
                            <Input
                                type="date"
                                className={`h-8 text-xs ${isOverdue ? "border-red-500/40 text-red-400" : ""}`}
                                value={task.dueDate ? task.dueDate.split("T")[0] : ""}
                                onChange={(e) => update("dueDate", e.target.value || null)}
                            />
                        </div>
                    </div>

                    {/* ── Description ── */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                            <AlignLeft size={11} /> Description
                        </label>
                        {editingDesc ? (
                            <div className="space-y-2">
                                <Textarea
                                    value={descDraft}
                                    onChange={(e) => setDescDraft(e.target.value)}
                                    placeholder="Add a description…"
                                    className="text-sm resize-none min-h-[100px]"
                                    autoFocus
                                />
                                <div className="flex gap-2">
                                    <Button size="sm" className="h-7 text-xs" onClick={saveDescEdit}>Save</Button>
                                    <Button size="sm" variant="ghost" className="h-7 text-xs"
                                            onClick={() => { setDescDraft(task.description ?? ""); setEditingDesc(false); }}>
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div
                                onClick={() => { setDescDraft(task.description ?? ""); setEditingDesc(true); }}
                                className="text-sm cursor-pointer rounded-lg border border-transparent hover:border-border/60 hover:bg-muted/30 px-3 py-2.5 min-h-[72px] transition-colors"
                            >
                                {task.description
                                    ? <p className="whitespace-pre-wrap text-foreground leading-relaxed">{task.description}</p>
                                    : <p className="text-muted-foreground italic">Click to add a description…</p>
                                }
                            </div>
                        )}
                    </div>

                    {/* ── Timestamps ── */}
                    <div className="text-xs text-muted-foreground flex items-center gap-3 border-t border-border/40 pt-3">
                        <span>Created {formatDate(task.createdAt)}</span>
                        <span className="text-border">·</span>
                        <span>Updated {formatDate(task.updatedAt)} at {formatTime(task.updatedAt)}</span>
                    </div>

                    {/* ── Comments ── */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <MessageSquare size={14} className="text-muted-foreground" />
                            Comments
                            {task.comments.length > 0 && (
                                <span className="text-xs text-muted-foreground font-normal">
                  ({task.comments.length})
                </span>
                            )}
                        </h4>

                        {/* Existing comments */}
                        {task.comments.length === 0 ? (
                            <p className="text-xs text-muted-foreground italic px-1">
                                No comments yet. Be the first to add one.
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {task.comments.map((comment) => (
                                    <div key={comment.id} className="flex items-start gap-3 group">
                                        <Avatar className="w-7 h-7 shrink-0 mt-0.5">
                                            <AvatarImage src={comment.author.avatarUrl ?? undefined} />
                                            <AvatarFallback className="text-[9px] bg-primary/20 text-primary">
                                                {getInitials(comment.author.fullName)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-foreground">
                            {comment.author.fullName ?? comment.author.email ?? "Unknown"}
                          </span>
                                                    <span className="text-[10px] text-muted-foreground">
                            {formatDate(comment.createdAt)}
                          </span>
                                                </div>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                                                    onClick={() => onDeleteComment(task!.id, comment.id)}
                                                >
                                                    <X size={10} />
                                                </Button>
                                            </div>
                                            <div className="bg-muted/40 rounded-lg px-3 py-2.5 text-sm text-foreground whitespace-pre-wrap">
                                                {comment.body}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Add comment */}
                        <div className="border-t border-border/40 pt-4 space-y-2">
                            <Textarea
                                placeholder="Write a comment…"
                                value={commentBody}
                                onChange={(e) => setCommentBody(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submitComment();
                                }}
                                className="text-sm resize-none min-h-[72px]"
                            />
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] text-muted-foreground">⌘ Enter to submit</span>
                                <Button
                                    size="sm"
                                    className="h-7 text-xs gap-1.5"
                                    onClick={submitComment}
                                    disabled={!commentBody.trim() || submittingComment}
                                >
                                    <Send size={11} />
                                    Comment
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}