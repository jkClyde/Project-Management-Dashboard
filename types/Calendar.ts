import { TaskPriority, TaskStatus } from "./task";
import { ProjectStatus } from "./projects";

// A lightweight event shape used exclusively by the calendar
export interface CalendarTask {
    id: string;
    title: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate: string; // ISO date string (YYYY-MM-DD)
    projectId: string;
    projectName: string;
    projectColor: string;
    assigneeId?: string | null;
    assigneeName?: string | null;
    assigneeAvatar?: string | null;
}

export interface CalendarProject {
    id: string;
    name: string;
    color: string;
    icon: string;
    status: ProjectStatus;
    dueDate?: string | null; // projects may not have a due date in your schema — optional
}

export interface CalendarData {
    tasks: CalendarTask[];
    projects: CalendarProject[];
}