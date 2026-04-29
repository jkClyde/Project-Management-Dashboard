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

export interface TaskDetail {
    id: string;
    title: string;
    description?: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate?: string | null;
    assignee?: TaskMember | null;
    projectId: string;
    projectName: string;
    projectColor: string;
    createdAt: string;
    updatedAt: string;
    comments: TaskComment[];
}