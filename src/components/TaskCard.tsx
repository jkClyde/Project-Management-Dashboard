// components/TaskCard.tsx
"use client";

import { MoreHorizontal, Trash2, Pencil, Calendar, Flag } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { TaskDetail } from "@/hooks/useProjectDetail";

interface TaskCardProps {
    task: TaskDetail;
    onEdit: (task: TaskDetail) => void;
    onDelete: (taskId: string) => void;
    isDragging?: boolean;
}

type TaskPriority = "low" | "medium" | "high" | "urgent";

const priorityConfig: Record<
    TaskPriority,
    {
        label: string;
        className: string;
    }
> = {
    low: {
        label: "Low",
        className: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    },
    medium: {
        label: "Medium",
        className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    },
    high: {
        label: "High",
        className: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    },
    urgent: {
        label: "Urgent",
        className: "bg-red-500/10 text-red-400 border-red-500/20",
    },
};

function getInitials(name?: string | null) {
    if (!name) return "?";

    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
}

function isOverdue(dueDate?: Date | string | null) {
    if (!dueDate) return false;

    return new Date(dueDate) < new Date();
}

function getPriority(priority?: string | null): TaskPriority {
    if (
        priority === "low" ||
        priority === "medium" ||
        priority === "high" ||
        priority === "urgent"
    ) {
        return priority;
    }

    return "medium";
}

export default function TaskCard({
    task,
    onEdit,
    onDelete,
    isDragging,
}: TaskCardProps) {
    const priorityKey = getPriority(task.priority);
    const priority = priorityConfig[priorityKey];
    const overdue = isOverdue(task.dueDate);

    return (
        <div
            className={`bg-background border rounded-lg p-3 space-y-2.5 cursor-grab active:cursor-grabbing group transition-shadow ${isDragging ? "shadow-lg rotate-1 opacity-90" : "hover:shadow-sm"
                }`}
        >
            <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-foreground leading-snug flex-1">
                    {task.title}
                </p>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            type="button"
                            className="p-0.5 rounded text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground hover:bg-muted transition-all shrink-0"
                        >
                            <MoreHorizontal size={14} />
                        </button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuItem
                            className="gap-2 text-xs"
                            onClick={() => onEdit(task)}
                        >
                            <Pencil size={12} />
                            Edit task
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                            className="gap-2 text-xs text-destructive focus:text-destructive"
                            onClick={() => onDelete(task.id)}
                        >
                            <Trash2 size={12} />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {"description" in task && task.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {task.description}
                </p>
            )}

            {Array.isArray(task.taskLabels) && task.taskLabels.length > 0 && (
                <div className="flex flex-wrap gap-1">
                    {task.taskLabels.map(
                        (taskLabel: { label: { id: string; name: string; color: string | null } }) => {
                            const label = taskLabel.label;

                            return (
                                <span
                                    key={label.id}
                                    className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                                    style={{
                                        backgroundColor: `${label.color ?? "#6366f1"}22`,
                                        color: label.color ?? "#6366f1",
                                    }}
                                >
                                    {label.name}
                                </span>
                            );
                        }
                    )}
                </div>
            )}

            <div className="flex items-center justify-between gap-2 pt-0.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 h-4 gap-1 ${priority.className}`}
                    >
                        <Flag size={9} />
                        {priority.label}
                    </Badge>

                    {task.dueDate && (
                        <div
                            className={`flex items-center gap-1 text-[11px] ${overdue ? "text-red-400" : "text-muted-foreground"
                                }`}
                        >
                            <Calendar size={10} />
                            {new Date(task.dueDate).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                            })}
                        </div>
                    )}
                </div>

                {task.assignee && (
                    <Avatar className="w-5 h-5 shrink-0">
                        <AvatarImage src={task.assignee.avatarUrl ?? undefined} />
                        <AvatarFallback className="text-[8px] bg-primary/20 text-primary">
                            {getInitials(task.assignee.fullName)}
                        </AvatarFallback>
                    </Avatar>
                )}
            </div>
        </div>
    );
}