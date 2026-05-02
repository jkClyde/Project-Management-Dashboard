// components/KanbanBoard.tsx
"use client";

import { useState, useRef } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import TaskCard from "@/components/TaskCard";
import AddTaskModal from "@/components/AddTaskModal";
import type { TaskDetail, ProjectDetail } from "@/hooks/useProjectDetail";
import { TaskStatus, TaskPriority } from "@prisma/client";

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
    }) => void;
    onMoveTask: (taskId: string, newStatus: TaskStatus, newPosition: number) => void;
    onDeleteTask: (taskId: string) => void;
}

const COLUMNS: { id: TaskStatus; label: string; color: string; dotColor: string }[] = [
    { id: "todo", label: "To Do", color: "border-t-slate-400", dotColor: "bg-slate-400" },
    { id: "in_progress", label: "In Progress", color: "border-t-amber-400", dotColor: "bg-amber-400" },
    { id: "done", label: "Done", color: "border-t-emerald-400", dotColor: "bg-emerald-400" },
];

export default function KanbanBoard({
    tasks,
    members,
    onCreateTask,
    onUpdateTask,
    onMoveTask,
    onDeleteTask,
}: KanbanBoardProps) {
    const [modalOpen, setModalOpen] = useState(false);
    const [defaultStatus, setDefault] = useState<TaskStatus>("todo");
    const [editTask, setEditTask] = useState<TaskDetail | null>(null);

    // Drag state
    const draggingId = useRef<string | null>(null);
    const [dragOver, setDragOver] = useState<TaskStatus | null>(null);

    const tasksByStatus = (status: TaskStatus) =>
        tasks
            .filter((t) => t.status === status)
            .sort((a, b) => a.position - b.position);

    // ── Drag handlers ─────────────────────────────────────────────────────────
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

        const colTasks = tasksByStatus(status);
        const newPosition = colTasks.length; // drop at end
        onMoveTask(taskId, status, newPosition);
        draggingId.current = null;
    };

    const handleDragEnd = () => {
        setDragOver(null);
        draggingId.current = null;
    };

    // ── Open modal helpers ────────────────────────────────────────────────────
    const openAdd = (status: TaskStatus) => {
        setEditTask(null);
        setDefault(status);
        setModalOpen(true);
    };

    const openEdit = (task: TaskDetail) => {
        setEditTask(task);
        setModalOpen(true);
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
                            className={`bg-primary-foreground rounded-lg border border-t-2 border-border/50 transition-colors
                ${col.color} ${isOver ? "border-primary/40 bg-primary/5" : ""}`}
                            onDragOver={(e) => handleDragOver(e, col.id)}
                            onDrop={(e) => handleDrop(e, col.id)}
                            onDragLeave={() => setDragOver(null)}
                        >
                            {/* Column header */}
                            <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/50">
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                                    <span className="text-sm font-medium text-foreground">{col.label}</span>
                                    <span className="text-xs text-muted-foreground bg-muted rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                                        {colTasks.length}
                                    </span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                    onClick={() => openAdd(col.id)}
                                >
                                    <Plus size={13} />
                                </Button>
                            </div>

                            {/* Task cards */}
                            <div className="p-2 space-y-2 min-h-[120px]">
                                {colTasks.length === 0 && !isOver && (
                                    <div className="flex items-center justify-center h-[80px] border border-dashed border-border/50 rounded-md">
                                        <p className="text-xs text-muted-foreground">No tasks</p>
                                    </div>
                                )}

                                {colTasks.map((task) => (
                                    <div
                                        key={task.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, task.id)}
                                        onDragEnd={handleDragEnd}
                                    >
                                        <TaskCard
                                            task={task}
                                            onEdit={openEdit}
                                            onDelete={onDeleteTask}
                                        />
                                    </div>
                                ))}

                                {/* Drop indicator */}
                                {isOver && (
                                    <div className="h-10 border-2 border-dashed border-primary/40 rounded-lg bg-primary/5 flex items-center justify-center">
                                        <span className="text-xs text-primary/60">Drop here</span>
                                    </div>
                                )}
                            </div>

                            {/* Add task button at bottom */}
                            <div className="px-2 pb-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full h-8 text-xs text-muted-foreground hover:text-foreground gap-1 justify-start"
                                    onClick={() => openAdd(col.id)}
                                >
                                    <Plus size={12} />
                                    Add task
                                </Button>
                            </div>
                        </div>
                    );
                })}
            </div>

            <AddTaskModal
                open={modalOpen}
                onClose={() => { setModalOpen(false); setEditTask(null); }}
                onSubmit={onCreateTask}
                onUpdate={onUpdateTask}
                defaultStatus={defaultStatus}
                editTask={editTask}
                members={members}
            />
        </>
    );
}