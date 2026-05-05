"use client";

import { useState, useEffect, useCallback } from "react";
import {
    getMyTasks,
    updateTask as updateTaskAction,
    deleteTask as deleteTaskAction,
} from "@/lib/actions/task";
import type { MyTaskRow } from "@/lib/actions/task";
import type { TaskDetail } from "../../types/task";

interface UseMyTasksReturn {
    tasks: TaskDetail[];
    loading: boolean;
    error: string | null;
    updateTask: (taskId: string, updates: Partial<Omit<TaskDetail, "comments">>) => Promise<void>;
    deleteTask: (taskId: string) => Promise<void>;
    addComment: (taskId: string, body: string) => Promise<void>;
    deleteComment: (taskId: string, commentId: string) => Promise<void>;
}

function mapRowToDetail(t: MyTaskRow): TaskDetail {
    return {
        id: t.id,
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate,
        projectId: t.projectId,
        projectName: t.projectName,
        projectColor: t.projectColor,
        assignee: t.assignee ?? null,
        assigneeId: t.assignee?.id ?? null,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        position: 0,
        taskLabels: [],
        comments: [],
    };
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
            setTasks(data.map(mapRowToDetail));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load tasks");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    // ── Update ─────────────────────────────────────────────────────────────────
    const updateTask = useCallback(
        async (taskId: string, updates: Partial<Omit<TaskDetail, "comments">>) => {
            setTasks((prev) =>
                prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
            );
            try {
                const prismaUpdates: Record<string, any> = {};
                if (updates.title !== undefined)       prismaUpdates.title = updates.title;
                if (updates.description !== undefined) prismaUpdates.description = updates.description;
                if (updates.status !== undefined)      prismaUpdates.status = updates.status;
                if (updates.priority !== undefined)    prismaUpdates.priority = updates.priority;
                if (updates.dueDate !== undefined)     prismaUpdates.dueDate = updates.dueDate ? new Date(updates.dueDate) : null;
                if (updates.assignee !== undefined)    prismaUpdates.assigneeId = updates.assignee?.id ?? null;

                await updateTaskAction(taskId, prismaUpdates);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Update failed");
                fetchTasks();
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
                fetchTasks();
            }
        },
        [fetchTasks]
    );

    // ── Add comment ───────────────────────────────────────────────────────────
    const addComment = useCallback(async (_taskId: string, _body: string) => {
        // TODO: add a createComment server action to src/lib/actions/task.ts
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