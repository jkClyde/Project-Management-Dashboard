// hooks/useProjectDetail.ts
"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { getProjectDetail } from "@/lib/actions/task";
import {
    createTask as createTaskAction,
    updateTask as updateTaskAction,
    moveTask as moveTaskAction,
    deleteTask as deleteTaskAction,
} from "@/lib/actions/task";
import { TaskStatus, TaskPriority } from "@/generated/prisma/enums";

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
    const [isPending, startTransition] = useTransition();

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

    const createTask = (input: {
        title: string;
        description?: string;
        status?: TaskStatus;
        priority?: TaskPriority;
        assigneeId?: string;
        dueDate?: Date;
    }) => {
        startTransition(async () => {
            await createTaskAction({ projectId, ...input });
            await fetchProject();
        });
    };

    const updateTask = (
        taskId: string,
        input: Parameters<typeof updateTaskAction>[1]
    ) => {
        startTransition(async () => {
            await updateTaskAction(taskId, input);
            await fetchProject();
        });
    };

    const moveTask = (
        taskId: string,
        newStatus: TaskStatus,
        newPosition: number
    ) => {
        setProject((prev) => {
            if (!prev) return prev;

            return {
                ...prev,
                tasks: prev.tasks.map((task) =>
                    task.id === taskId
                        ? { ...task, status: newStatus, position: newPosition }
                        : task
                ),
            };
        });

        startTransition(async () => {
            await moveTaskAction(taskId, newStatus, newPosition);
        });
    };

    const deleteTask = (taskId: string) => {
        setProject((prev) => {
            if (!prev) return prev;

            return {
                ...prev,
                tasks: prev.tasks.filter((task) => task.id !== taskId),
            };
        });

        startTransition(async () => {
            await deleteTaskAction(taskId);
        });
    };

    return {
        project,
        loading: loading || isPending,
        error,
        refetch: fetchProject,
        createTask,
        updateTask,
        moveTask,
        deleteTask,
    };
}