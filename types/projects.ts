// types/projects.ts

export type ProjectStatus = "active" | "archived" | "completed";
export type MemberRole = "admin" | "member" | "viewer";
export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface ProjectWithStats {
    id: string;
    name: string;
    description: string | null;
    color: string;
    icon: string;
    status: ProjectStatus;
    ownerId: string;
    createdAt: Date;
    updatedAt: Date;
    ownerName: string | null;
    ownerAvatar: string | null;
    memberCount: number;
    taskCount: number;
    tasksCompleted: number;
}

export interface CreateProjectInput {
    name: string;
    description?: string;
    color?: string;
    icon?: string;
}

export interface UpdateProjectInput {
    name?: string;
    description?: string;
    color?: string;
    icon?: string;
    status?: ProjectStatus;
}