"use client";

import { useState, useRef } from "react";
import { Plus, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import TaskCard from "@/components/TaskCard";
import AddTaskModal from "@/components/AddTaskModal";
import TaskDetailModal from "@/components/TaskDetailModal";

import type { TaskDetail, TaskStatus, TaskPriority } from "../../types/task";
import type { ProjectDetail } from "../hooks/useProjectDetail";

// ─── Types ────────────────────────────────────────────────────────────────────

interface KanbanBoardProps {
    tasks: TaskDetail[];
    members: ProjectDetail["members"];
    onCreateTask: (input: {
        title: string;
        description?: string;
        status?: TaskStatus;
        priority?: TaskPriority;
        assigneeId?: string;
        dueDate?: Date;
    }) => void;
    onUpdateTask: (taskId: string, input: {
        title?: string;
        description?: string;
        priority?: TaskPriority;
        assigneeId?: string | null;
        dueDate?: Date | null;
        status?: TaskStatus;
    }) => void;
    onMoveTask: (taskId: string, newStatus: TaskStatus, newPosition: number) => void;
    onDeleteTask: (taskId: string) => void;
}

// ─── Columns ────────────────────────────────────────────────────────────────

const COLUMNS: {
    id: TaskStatus;
    label: string;
    accentCls: string;
    dotCls: string;
    countCls: string;
}[] = [
    {
        id: "todo",
        label: "To Do",
        accentCls: "border-t-slate-400",
        dotCls: "bg-slate-400",
        countCls: "bg-slate-400/10 text-slate-500 dark:text-slate-400",
    },
    {
        id: "in_progress",
        label: "In Progress",
        accentCls: "border-t-amber-400",
        dotCls: "bg-amber-400",
        countCls: "bg-amber-400/10 text-amber-600 dark:text-amber-400",
    },
    {
        id: "done",
        label: "Done",
        accentCls: "border-t-emerald-400",
        dotCls: "bg-emerald-400",
        countCls: "bg-emerald-400/10 text-emerald-600 dark:text-emerald-400",
    },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function KanbanBoard({
    tasks,
    members,
    onCreateTask,
    onUpdateTask,
    onMoveTask,
    onDeleteTask,
}: KanbanBoardProps) {
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [defaultStatus, setDefault] = useState<TaskStatus>("todo");
    const [editTask, setEditTask] = useState<TaskDetail | null>(null);
    const [detailTask, setDetailTask] = useState<TaskDetail | null>(null);

    const draggingId = useRef<string | null>(null);
    const [dragOver, setDragOver] = useState<TaskStatus | null>(null);

    const tasksByStatus = (status: TaskStatus) =>
        tasks
            .filter((t) => t.status === status)
            .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

    const handleDragStart = (e: React.DragEvent, taskId: string) => {
        draggingId.current = taskId;
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setDragOver(status);
    };

    const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
        e.preventDefault();
        setDragOver(null);

        const taskId = draggingId.current;
        if (!taskId) return;

        onMoveTask(taskId, status, tasksByStatus(status).length);
        draggingId.current = null;
    };

    const handleDragEnd = () => {
        setDragOver(null);
        draggingId.current = null;
    };

    const openAdd = (status: TaskStatus) => {
        setEditTask(null);
        setDefault(status);
        setAddModalOpen(true);
    };

    const handleModalUpdate = async (id: string, updates: Partial<TaskDetail>) => {
        await onUpdateTask(id, {
            title: updates.title,
            description: updates.description ?? undefined,
            priority: updates.priority as TaskPriority | undefined,
            status: updates.status as TaskStatus | undefined,
            assigneeId:
                updates.assignee !== undefined
                    ? (updates.assignee?.id ?? null)
                    : undefined,
            dueDate:
                updates.dueDate !== undefined
                    ? (updates.dueDate ? new Date(updates.dueDate) : null)
                    : undefined,
        });

        setDetailTask((prev) => (prev ? { ...prev, ...updates } : null));
    };

    const handleModalDelete = async (id: string) => {
        onDeleteTask(id);
        setDetailTask(null);
    };

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                {COLUMNS.map((col) => {
                    const colTasks = tasksByStatus(col.id);
                    const isOver = dragOver === col.id;

                    return (
                        <div
                            key={col.id}
                            className={`bg-card rounded-xl border-t-2 border border-border/50 flex flex-col transition-all duration-150 ${col.accentCls} ${isOver ? "border-primary/40 bg-primary/5 scale-[1.01]" : ""}`}
                            onDragOver={(e) => handleDragOver(e, col.id)}
                            onDrop={(e) => handleDrop(e, col.id)}
                            onDragLeave={() => setDragOver(null)}
                        >
                            <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/50">
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${col.dotCls}`} />
                                    <span className="text-sm font-medium">{col.label}</span>
                                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${col.countCls}`}>
                                        {colTasks.length}
                                    </span>
                                </div>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => openAdd(col.id)}
                                >
                                    <Plus size={13} />
                                </Button>
                            </div>

                            <div className="p-2 space-y-2 min-h-[120px] flex-1">
                                {colTasks.map((task) => (
                                    <div
                                        key={task.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, task.id)}
                                        onDragEnd={handleDragEnd}
                                        className="group/card relative"
                                    >
                                        <button
                                            onClick={() => setDetailTask(task)}
                                            className="absolute inset-0 opacity-0 group-hover/card:opacity-100"
                                        >
                                            <span className="text-xs flex items-center gap-1">
                                                <Eye size={10} /> View
                                            </span>
                                        </button>

                                        <TaskCard
                                            task={task}
                                            onEdit={(t) => {
                                                setEditTask(t);
                                                setAddModalOpen(true);
                                            }}
                                            onDelete={onDeleteTask}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            <AddTaskModal
                open={addModalOpen}
                onClose={() => {
                    setAddModalOpen(false);
                    setEditTask(null);
                }}
                onSubmit={onCreateTask}
                onUpdate={onUpdateTask}
                defaultStatus={defaultStatus}
                editTask={editTask}
                members={members}
            />

            <TaskDetailModal
                task={detailTask}
                open={!!detailTask}
                onClose={() => setDetailTask(null)}
                onUpdate={handleModalUpdate}
                onDelete={handleModalDelete}
                onAddComment={async () => {}}
                onDeleteComment={async () => {}}
            />
        </>
    );
}