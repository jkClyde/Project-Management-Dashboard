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
import type { TaskDetail } from "../../types/task";

/**
 * ─────────────────────────────────────────────
 * API TYPES (LOCAL ONLY — NEVER EXPOSED TO UI)
 * ─────────────────────────────────────────────
 */
type ApiTask = {
    id: string;
    projectId: string;
    title: string;
    description?: string | null;
    status: string | null;
    priority: string | null;
    assigneeId?: string | null;
    dueDate?: Date | string | null;
    position?: number | null;
    createdAt?: Date | string | null;
    updatedAt?: Date | string | null;

    assignee?: {
        id: string;
        fullName: string | null;
        avatarUrl: string | null;
        email?: string | null;
    } | null;

    taskLabels?: {
        label: {
            id: string;
            name: string;
            color: string | null;
        };
    }[];

    comments?: {
        id: string;
        body: string;
        createdAt: string;
        author: {
            id: string;
            fullName?: string | null;
            avatarUrl?: string | null;
            email?: string | null;
        };
    }[];
};

type ApiProject = {
    id: string;
    name: string;
    description: string | null;
    color: string | null;
    icon: string | null;
    status: string | null;
    ownerId: string;
    createdAt: Date | null;
    updatedAt: Date | null;

    owner: any;
    members: any[];
    labels: any[];
    tasks: ApiTask[];
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

    owner: any;
    members: any[];
    labels: any[];
    tasks: TaskDetail[];
};

/**
 * ─────────────────────────────────────────────
 * MAPPER: API → UI TASK
 * ─────────────────────────────────────────────
 */
function mapTask(task: ApiTask, projectName: string, projectColor: string): TaskDetail {
    return {
        id: task.id,
        projectId: task.projectId,
        title: task.title,
        description: task.description ?? null,

        status: (task.status ?? "todo") as TaskStatus,
        priority: (task.priority ?? "medium") as TaskPriority,

        dueDate: task.dueDate ? new Date(task.dueDate).toISOString() : null,
        createdAt: task.createdAt ? new Date(task.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: task.updatedAt ? new Date(task.updatedAt).toISOString() : new Date().toISOString(),

        assignee: task.assignee
            ? {
                id: task.assignee.id,
                fullName: task.assignee.fullName,
                avatarUrl: task.assignee.avatarUrl,
                email: task.assignee.email ?? null,
            }
            : null,

        assigneeId: task.assigneeId ?? null,

        projectName,
        projectColor,

        position: task.position ?? 0,

        taskLabels: task.taskLabels ?? [],
        comments:
            task.comments?.map((c) => ({
                id: c.id,
                body: c.body,
                createdAt: c.createdAt,
                author: {
                    id: c.author.id,
                    fullName: c.author.fullName ?? null,
                    avatarUrl: c.author.avatarUrl ?? null,
                    email: c.author.email ?? null,
                },
            })) ?? [],
    };
}

/**
 * ─────────────────────────────────────────────
 * MAIN HOOK
 * ─────────────────────────────────────────────
 */
export function useProjectDetail(projectId: string) {
    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [, startTransition] = useTransition();

    const fetchProject = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const data = (await getProjectDetail(projectId)) as ApiProject;

            setProject({
                ...data,
                tasks: data.tasks.map((t) =>
                    mapTask(t, data.name, data.color ?? "#ccc")
                ),
            });
        } catch (err: any) {
            setError(err?.message ?? "Failed to load project");
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchProject();
    }, [fetchProject]);

    // ───────────────────────── CREATE ─────────────────────────
    const createTask = (input: {
        title: string;
        description?: string;
        status?: TaskStatus;
        priority?: TaskPriority;
        assigneeId?: string;
        dueDate?: Date;
    }) => {
        const tempId = `temp-${Date.now()}`;

        const optimistic: TaskDetail = {
            id: tempId,
            projectId,
            title: input.title,
            description: input.description ?? null,
            status: input.status ?? "todo",
            priority: input.priority ?? "medium",
            assigneeId: input.assigneeId ?? null,
            dueDate: input.dueDate ? input.dueDate.toISOString() : null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            assignee: null,
            projectName: project?.name ?? "",
            projectColor: project?.color ?? "#ccc",
            position: 0,
            taskLabels: [],
            comments: [],
        };

        setProject((prev: any) =>
            prev ? { ...prev, tasks: [...prev.tasks, optimistic] } : prev
        );

        startTransition(async () => {
            try {
                const created = await createTaskAction({ projectId, ...input });

                setProject((prev: any) => ({
                    ...prev,
                    tasks: prev.tasks.map((t: TaskDetail) =>
                        t.id === tempId
                            ? mapTask(created, project.name, project.color ?? "#ccc")
                            : t
                    ),
                }));
            } catch {
                setProject((prev: any) => ({
                    ...prev,
                    tasks: prev.tasks.filter((t: TaskDetail) => t.id !== tempId),
                }));
            }
        });
    };

    // ───────────────────────── UPDATE ─────────────────────────
    const updateTask = (taskId: string, input: any) => {
        setProject((prev: any) => ({
            ...prev,
            tasks: prev.tasks.map((t: TaskDetail) =>
                t.id === taskId ? { ...t, ...input } : t
            ),
        }));

        startTransition(async () => {
            try {
                await updateTaskAction(taskId, input);
            } catch {
                fetchProject();
            }
        });
    };

    // ───────────────────────── MOVE ─────────────────────────
    const moveTask = (taskId: string, status: TaskStatus, position: number) => {
        setProject((prev: any) => ({
            ...prev,
            tasks: prev.tasks.map((t: TaskDetail) =>
                t.id === taskId ? { ...t, status, position } : t
            ),
        }));

        startTransition(async () => {
            try {
                await moveTaskAction(taskId, status, position);
            } catch {
                fetchProject();
            }
        });
    };

    // ───────────────────────── DELETE ─────────────────────────
    const deleteTask = (taskId: string) => {
        setProject((prev: any) => ({
            ...prev,
            tasks: prev.tasks.filter((t: TaskDetail) => t.id !== taskId),
        }));

        startTransition(async () => {
            try {
                await deleteTaskAction(taskId);
            } catch {
                fetchProject();
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