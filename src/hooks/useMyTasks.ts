"use client";

import { useState, useEffect, useCallback } from "react";
import {
    getMyTasks,
    updateTask as updateTaskAction,
    deleteTask as deleteTaskAction,
} from "@/lib/actions/task";
import { TaskDetail } from "../../types/task";

interface UseMyTasksReturn {
    tasks: TaskDetail[];
    loading: boolean;
    error: string | null;
    updateTask: (taskId: string, updates: Partial<Omit<TaskDetail, "comments">>) => Promise<void>;
    deleteTask: (taskId: string) => Promise<void>;
    addComment: (taskId: string, body: string) => Promise<void>;
    deleteComment: (taskId: string, commentId: string) => Promise<void>;
}

export function useMyTasks(): UseMyTasksReturn {
    const [tasks, setTasks] = useState<TaskDetail[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // ── Fetch ──────────────────────────────────────────────────────────────────
    const fetchTasks = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getMyTasks();
            const mapped: TaskDetail[] = data.map((t: any) => ({
                ...t,
                status: t.status ?? "todo",
                priority: t.priority ?? "medium",
                dueDate: t.dueDate ? new Date(t.dueDate).toISOString() : null,
                createdAt: t.createdAt ? new Date(t.createdAt).toISOString() : new Date().toISOString(),
                updatedAt: t.updatedAt ? new Date(t.updatedAt).toISOString() : new Date().toISOString(),
                assignee: t.assignee ?? null,
                assigneeId: t.assigneeId ?? null,
                projectName: t.project?.name ?? "",
                projectColor: t.project?.color ?? "#ccc",
                position: t.position ?? 0,
                taskLabels: t.taskLabels ?? [],   // ← this is what was missing
                comments: t.comments ?? [],
            }));
            setTasks(mapped);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load tasks");
        } finally {
            setLoading(false);
        }
    }, []);

    // ── Update ─────────────────────────────────────────────────────────────────
    const updateTask = useCallback(
        async (taskId: string, updates: Partial<Omit<TaskDetail, "comments">>) => {
            // Optimistic update
            setTasks((prev) =>
                prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
            );
            try {
                // Map TaskDetail fields back to Prisma-compatible shape
                const prismaUpdates: Record<string, any> = {};
                if (updates.title !== undefined) prismaUpdates.title = updates.title;
                if (updates.description !== undefined) prismaUpdates.description = updates.description;
                if (updates.status !== undefined) prismaUpdates.status = updates.status;
                if (updates.priority !== undefined) prismaUpdates.priority = updates.priority;
                if (updates.dueDate !== undefined) prismaUpdates.dueDate = updates.dueDate ? new Date(updates.dueDate) : null;
                if (updates.assignee !== undefined) prismaUpdates.assigneeId = updates.assignee?.id ?? null;

                await updateTaskAction(taskId, prismaUpdates);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Update failed");
                fetchTasks(); // roll back
            }
        },
        [fetchTasks]
    );

    // ── Delete ─────────────────────────────────────────────────────────────────
    const deleteTask = useCallback(
        async (taskId: string) => {
            setTasks((prev) => prev.filter((t) => t.id !== taskId));
            try {
                await deleteTaskAction(taskId);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Delete failed");
                fetchTasks(); // roll back
            }
        },
        [fetchTasks]
    );

    // ── Add comment ───────────────────────────────────────────────────────────
    // Comments are not managed via server actions yet — stub kept for modal compatibility
    const addComment = useCallback(async (_taskId: string, _body: string) => {
        // TODO: add a createComment server action to src/lib/actions/task.ts
        // Then call it here and append the result to the matching task's comments array
        console.warn("addComment: no server action implemented yet");
    }, []);

    // ── Delete comment ────────────────────────────────────────────────────────
    const deleteComment = useCallback(
        async (taskId: string, commentId: string) => {
            setTasks((prev) =>
                prev.map((t) =>
                    t.id === taskId
                        ? { ...t, comments: (t.comments ?? []).filter((c) => c.id !== commentId) }
                        : t
                )
            );
            // TODO: add a deleteComment server action to src/lib/actions/task.ts
            console.warn("deleteComment: no server action implemented yet");
        },
        []
    );

    return { tasks, loading, error, updateTask, deleteTask, addComment, deleteComment };
}