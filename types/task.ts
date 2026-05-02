export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface TaskMember {
    id: string;
    fullName?: string | null;
    avatarUrl?: string | null;
    email?: string | null;
}

export interface TaskComment {
    id: string;
    body: string;
    author: TaskMember;
    createdAt: string;
}

export interface TaskLabel {
    label: {
        id: string;
        name: string;
        color: string | null;
    };
}

/**
 * UI TASK MODEL (ONLY THING COMPONENTS USE)
 */
export interface TaskDetail {
    id: string;
    projectId: string;
    title: string;
    description?: string | null;

    status: TaskStatus;
    priority: TaskPriority;

    dueDate?: string | null;
    createdAt: string;
    updatedAt: string;

    assignee?: TaskMember | null;
    assigneeId?: string | null;

    projectName: string;
    projectColor: string;

    position?: number | null;

    taskLabels: TaskLabel[];
    comments: TaskComment[];
}