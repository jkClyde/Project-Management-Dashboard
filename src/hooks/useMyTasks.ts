"use client";

import { useState, useEffect, useCallback } from "react";
import { TaskDetail } from "@/types/task";

interface UseMyTasksReturn {
    tasks: TaskDetail[];
    loading: boolean;
    error: string | null;
    updateTask: (
        taskId: string,
        updates: Partial<Omit<TaskDetail, "comments">>
    ) => Promise<void>;
    deleteTask: (taskId: string) => Promise<void>;
    addComment: (taskId: string, body: string) => Promise<void>;
    deleteComment: (taskId: string, commentId: string) => Promise<void>;
}

export function useMyTasks(): UseMyTasksReturn {
    const [tasks, setTasks] = useState<TaskDetail[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // ── FETCH ─────────────────────────────────────────────
    const fetchTasks = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/tasks/mine", {
                credentials: "include", // IMPORTANT
            });

            if (!res.ok) {
                if (res.status === 401) {
                    throw new Error("Unauthorized");
                }
                throw new Error("Failed to fetch tasks");
            }

            const data = await res.json();
            setTasks(data);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Unknown error"
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    // ── UPDATE ───────────────────────────────────────────
    const updateTask = useCallback(
        async (taskId: string, updates: any) => {
            setTasks((prev) =>
                prev.map((t) =>
                    t.id === taskId ? { ...t, ...updates } : t
                )
            );

            try {
                const res = await fetch(`/api/tasks/${taskId}`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(updates),
                });

                if (!res.ok)
                    throw new Error("Failed to update task");

                const updated = await res.json();

                setTasks((prev) =>
                    prev.map((t) =>
                        t.id === taskId ? { ...t, ...updated } : t
                    )
                );
            } catch {
                await fetchTasks();
            }
        },
        [fetchTasks]
    );

    // ── DELETE ───────────────────────────────────────────
    const deleteTask = useCallback(
        async (taskId: string) => {
            setTasks((prev) =>
                prev.filter((t) => t.id !== taskId)
            );

            try {
                const res = await fetch(`/api/tasks/${taskId}`, {
                    method: "DELETE",
                });

                if (!res.ok)
                    throw new Error("Failed to delete task");
            } catch {
                await fetchTasks();
            }
        },
        [fetchTasks]
    );

    // ── ADD COMMENT ──────────────────────────────────────
    const addComment = useCallback(
        async (taskId: string, body: string) => {
            try {
                const res = await fetch(
                    `/api/tasks/${taskId}/comments`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ body }),
                    }
                );

                if (!res.ok)
                    throw new Error("Failed to add comment");

                const newComment = await res.json();

                setTasks((prev) =>
                    prev.map((t) =>
                        t.id === taskId
                            ? {
                                ...t,
                                comments: [
                                    ...t.comments,
                                    newComment,
                                ],
                            }
                            : t
                    )
                );
            } catch (err) {
                console.error(err);
            }
        },
        []
    );

    // ── DELETE COMMENT ───────────────────────────────────
    const deleteComment = useCallback(
        async (taskId: string, commentId: string) => {
            setTasks((prev) =>
                prev.map((t) =>
                    t.id === taskId
                        ? {
                            ...t,
                            comments: t.comments.filter(
                                (c) => c.id !== commentId
                            ),
                        }
                        : t
                )
            );

            try {
                const res = await fetch(
                    `/api/tasks/${taskId}/comments/${commentId}`,
                    {
                        method: "DELETE",
                    }
                );

                if (!res.ok)
                    throw new Error("Failed to delete comment");
            } catch {
                await fetchTasks();
            }
        },
        [fetchTasks]
    );

    return {
        tasks,
        loading,
        error,
        updateTask,
        deleteTask,
        addComment,
        deleteComment,
    };
}