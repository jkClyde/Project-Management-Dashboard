"use client";

import { useState, useEffect, useCallback } from "react";
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
            // Fetch in parallel — adjust endpoints to match your API
            const [tasksRes, projectsRes] = await Promise.all([
                fetch("/api/tasks?calendar=true"),   // returns CalendarTask[]
                fetch("/api/projects"),               // returns ProjectWithStats[]
            ]);

            if (!tasksRes.ok) throw new Error(`Tasks fetch failed (${tasksRes.status})`);
            if (!projectsRes.ok) throw new Error(`Projects fetch failed (${projectsRes.status})`);

            const tasksData = await tasksRes.json();
            const projectsData = await projectsRes.json();

            // Normalise tasks — only keep ones with a dueDate
            const calTasks: CalendarTask[] = (tasksData as any[])
                .filter((t) => !!t.dueDate)
                .map((t) => ({
                    id: t.id,
                    title: t.title,
                    status: t.status,
                    priority: t.priority,
                    dueDate: t.dueDate,
                    projectId: t.projectId,
                    projectName: t.projectName,
                    projectColor: t.projectColor,
                    assigneeId: t.assignee?.id ?? t.assigneeId ?? null,
                    assigneeName: t.assignee?.fullName ?? t.assigneeName ?? null,
                    assigneeAvatar: t.assignee?.avatarUrl ?? t.assigneeAvatar ?? null,
                }));

            // Normalise projects
            const calProjects: CalendarProject[] = (projectsData as any[]).map((p) => ({
                id: p.id,
                name: p.name,
                color: p.color ?? "#6366f1",
                icon: p.icon ?? "📁",
                status: p.status ?? "active",
                dueDate: p.dueDate ?? null,
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