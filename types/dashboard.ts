export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type ActivityType = "task_done" | "project_created" | "member_joined" | "task_created" | "task_updated";

export interface DashboardStats {
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    archivedProjects: number;
    totalTasks: number;
    tasksByStatus: Record<TaskStatus, number>;
    tasksByPriority: Record<TaskPriority, number>;
    overdueTasks: OverdueTask[];
    recentActivity: ActivityItem[];
    teamMembers: number;
    overallProgress: number;
    completionRate: number;
    avgTasksPerProject: number;
    topProjects: TopProject[];
}

export interface OverdueTask {
    id: string;
    title: string;
    projectId: string;        // for linking to /projects/[id]
    projectName: string;
    projectColor: string;
    dueDate: string;
    priority: TaskPriority;
    assignee?: string;
    daysOverdue: number;
}

export interface ActivityItem {
    id: string;
    type: ActivityType;
    label: string;
    sub: string;
    time: string;
    user?: string;
    href: string;             // resolved link — /projects/[id] or /tasks?project=[id]
}

export interface TopProject {
    id: string;
    name: string;
    color: string;
    icon: string;
    taskCount: number;
    tasksCompleted: number;
    status: string;
}