"use client";

import Link from "next/link";
import { X, AlertTriangle, Clock, CheckCircle2, CircleDot } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CalendarTask } from "../../types/Calendar";
import { TaskStatus, TaskPriority } from "../../types/task";


// ─── Meta ─────────────────────────────────────────────────────────────────────

const STATUS_META: Record<TaskStatus, { label: string; cls: string; icon: React.ElementType }> = {
    todo:        { label: "To Do",       cls: "bg-slate-500/10 text-slate-400 border-slate-500/20",   icon: CircleDot },
    in_progress: { label: "In Progress", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20",  icon: Clock },
    done:        { label: "Done",        cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: CheckCircle2 },
};

const PRIORITY_DOT: Record<TaskPriority, string> = {
    low: "bg-sky-400", medium: "bg-yellow-400", high: "bg-orange-400", urgent: "bg-red-400",
};

function getInitials(name?: string | null) {
    if (!name) return "?";
    return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface CalendarDayPopoverProps {
    date: Date;
    tasks: CalendarTask[];
    onClose: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function CalendarDayPopover({ date, tasks, onClose }: CalendarDayPopoverProps) {
    const label = date.toLocaleDateString("en-US", {
        weekday: "long", month: "long", day: "numeric",
    });

    const isOverdue = (task: CalendarTask) =>
        new Date(task.dueDate) < new Date() && task.status !== "done";

    return (
        <div className="absolute z-50 top-full left-0 mt-1 w-72 bg-primary-foreground border border-border/60 rounded-xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
                <p className="text-xs font-medium text-foreground">{label}</p>
                <button
                    onClick={onClose}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                >
                    <X size={13} />
                </button>
            </div>

            {/* Tasks */}
            <div className="max-h-72 overflow-y-auto">
                {tasks.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-6 italic">
                        No tasks due this day
                    </p>
                ) : (
                    <ul className="divide-y divide-border/40">
                        {tasks.map((task) => {
                            const statusMeta = STATUS_META[task.status];
                            return (
                                <li key={task.id}>
                                    <Link
                                        href={`/tasks/${task.id}`}
                                        className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors group"
                                    >
                                        {/* Project color strip */}
                                        <span
                                            className="mt-1 w-2 h-2 rounded-sm shrink-0"
                                            style={{ backgroundColor: task.projectColor }}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-foreground truncate group-hover:text-primary transition-colors">
                                                {task.title}
                                            </p>
                                            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                                                {task.projectName}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <Badge
                                                    variant="outline"
                                                    className={`text-[10px] px-1.5 py-0 h-4 ${statusMeta.cls}`}
                                                >
                                                    {statusMeta.label}
                                                </Badge>
                                                <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[task.priority]}`} />
                                                {isOverdue(task) && (
                                                    <AlertTriangle size={10} className="text-red-400" />
                                                )}
                                            </div>
                                        </div>
                                        {task.assigneeName && (
                                            <Avatar className="w-5 h-5 shrink-0">
                                                {task.assigneeAvatar && (
                                                    <AvatarImage src={task.assigneeAvatar} />
                                                )}
                                                <AvatarFallback className="text-[8px]">
                                                    {getInitials(task.assigneeName)}
                                                </AvatarFallback>
                                            </Avatar>
                                        )}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}