"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { getProjectDetail } from "@/lib/actions/task";
import {
    createTask as createTaskAction,
    updateTask as updateTaskAction,
    moveTask as moveTaskAction,
    deleteTask as deleteTaskAction,
} from "@/lib/actions/task";
import { TaskStatus, TaskPriority } from "@prisma/client";

export type TaskDetail = {
    id: string;
    projectId: string;
    title: string;
    description?: string | null;
    status: string | null;
    priority: string | null;
    assigneeId: string | null;
    dueDate: Date | null;
    position: number | null;
    createdAt: Date | null;
    updatedAt: Date | null;
    assignee: {
        id: string;
        fullName: string | null;
        avatarUrl: string | null;
    } | null;
    taskLabels: {
        label: {
            id: string;
            name: string;
            color: string | null;
        };
    }[];
};

export type ProjectDetail = {
    id: string;
    name: string;
    description: string | null;
    color: string | null;
    icon: string | null;
    status: string | null;
    ownerId: string;
    createdAt: Date | null;
    updatedAt: Date | null;
    owner: {
        id: string;
        fullName: string | null;
        avatarUrl: string | null;
        email: string | null;
    } | null;
    members: {
        id: string;
        projectId: string;
        userId: string;
        role: string;
        joinedAt: Date;
        user: {
            id: string;
            fullName: string | null;
            avatarUrl: string | null;
            email: string | null;
        };
    }[];
    tasks: TaskDetail[];
    labels: {
        id: string;
        name: string;
        color: string | null;
    }[];
};

export function useProjectDetail(projectId: string) {
    const [project, setProject] = useState<ProjectDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [, startTransition] = useTransition();

    // ── Initial fetch only — mutations never re-fetch ─────────────────────────
    const fetchProject = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getProjectDetail(projectId);
            setProject(data as ProjectDetail);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to load project");
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchProject();
    }, [fetchProject]);

    // ── createTask — optimistic: append a temp task, replace with real on success ──
    const createTask = (input: {
        title: string;
        description?: string;
        status?: TaskStatus;
        priority?: TaskPriority;
        assigneeId?: string;
        dueDate?: Date;
    }) => {
        // Build a temporary task so the card appears instantly
        const tempId = `temp-${Date.now()}`;
        const assigneeMember = input.assigneeId
            ? project?.members.find((m) => m.userId === input.assigneeId)?.user ?? null
            : null;

        const optimisticTask: TaskDetail = {
            id: tempId,
            projectId,
            title: input.title,
            description: input.description ?? null,
            status: input.status ?? "todo",
            priority: input.priority ?? "medium",
            assigneeId: input.assigneeId ?? null,
            dueDate: input.dueDate ?? null,
            position: (project?.tasks.filter((t) => t.status === (input.status ?? "todo")).length ?? 0),
            createdAt: new Date(),
            updatedAt: new Date(),
            assignee: assigneeMember
                ? { id: assigneeMember.id, fullName: assigneeMember.fullName, avatarUrl: assigneeMember.avatarUrl }
                : null,
            taskLabels: [],
        };

        // Optimistically add
        setProject((prev) =>
            prev ? { ...prev, tasks: [...prev.tasks, optimisticTask] } : prev
        );

        startTransition(async () => {
            try {
                const created = await createTaskAction({ projectId, ...input });
                // Replace temp task with real one from server
                setProject((prev) => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        tasks: prev.tasks.map((t) =>
                            t.id === tempId ? (created as TaskDetail) : t
                        ),
                    };
                });
            } catch {
                // Rollback on failure
                setProject((prev) =>
                    prev ? { ...prev, tasks: prev.tasks.filter((t) => t.id !== tempId) } : prev
                );
            }
        });
    };

    // ── updateTask — optimistic: patch fields immediately ────────────────────
    const updateTask = (
        taskId: string,
        input: Parameters<typeof updateTaskAction>[1]
    ) => {
        // Save snapshot for rollback
        const snapshot = project?.tasks.find((t) => t.id === taskId);

        setProject((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                tasks: prev.tasks.map((t) =>
                    t.id === taskId ? { ...t, ...input, updatedAt: new Date() } : t
                ),
            };
        });

        startTransition(async () => {
            try {
                await updateTaskAction(taskId, input);
            } catch {
                // Rollback
                if (snapshot) {
                    setProject((prev) => {
                        if (!prev) return prev;
                        return {
                            ...prev,
                            tasks: prev.tasks.map((t) => (t.id === taskId ? snapshot : t)),
                        };
                    });
                }
            }
        });
    };

    // ── moveTask — already optimistic, keeping as-is ─────────────────────────
    const moveTask = (
        taskId: string,
        newStatus: TaskStatus,
        newPosition: number
    ) => {
        setProject((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                tasks: prev.tasks.map((t) =>
                    t.id === taskId
                        ? { ...t, status: newStatus, position: newPosition }
                        : t
                ),
            };
        });

        startTransition(async () => {
            try {
                await moveTaskAction(taskId, newStatus, newPosition);
            } catch {
                // Re-fetch only on move failure (rare)
                await fetchProject();
            }
        });
    };

    // ── deleteTask — already optimistic, keeping as-is ───────────────────────
    const deleteTask = (taskId: string) => {
        setProject((prev) =>
            prev ? { ...prev, tasks: prev.tasks.filter((t) => t.id !== taskId) } : prev
        );

        startTransition(async () => {
            try {
                await deleteTaskAction(taskId);
            } catch {
                await fetchProject();
            }
        });
    };

    return {
        project,
        loading,
        error,
        refetch: fetchProject,
        createTask,
        updateTask,
        moveTask,
        deleteTask,
    };
}