"use client";

import { useState, useEffect, useCallback } from "react";
import { getMyTasks } from "@/lib/actions/task";
import { getProjects } from "@/lib/actions/prisma";
import { CalendarTask, CalendarProject } from "../../types/Calendar";

interface UseCalendarReturn {
    tasks: CalendarTask[];
    projects: CalendarProject[];
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

export function useCalendar(): UseCalendarReturn {
    const [tasks, setTasks] = useState<CalendarTask[]>([]);
    const [projects, setProjects] = useState<CalendarProject[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [tasksData, projectsData] = await Promise.all([
                getMyTasks(),
                getProjects("all"),
            ]);

            // Only keep tasks that have a dueDate
            const calTasks: CalendarTask[] = tasksData
                .filter((t) => !!t.dueDate)
                .map((t) => ({
                    id: t.id,
                    title: t.title,
                    status: t.status,
                    priority: t.priority,
                    dueDate: t.dueDate!.split("T")[0],
                    projectId: t.projectId,
                    projectName: t.projectName,
                    projectColor: t.projectColor,
                    assigneeId: t.assignee?.id ?? null,
                    assigneeName: t.assignee?.fullName ?? null,
                    assigneeAvatar: t.assignee?.avatarUrl ?? null,
                }));

            const calProjects: CalendarProject[] = projectsData.map((p) => ({
                id: p.id,
                name: p.name,
                color: p.color,
                icon: p.icon,
                status: p.status,
                dueDate: null,
            }));

            setTasks(calTasks);
            setProjects(calProjects);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { tasks, projects, loading, error, refetch: fetchData };
}