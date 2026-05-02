"use server";

import { prisma } from "@/lib/prisma";
import { DashboardStats, OverdueTask, ActivityItem, TopProject } from "../../../types/dashboard";

export async function fetchDashboardStats(): Promise<DashboardStats> {
    const now = new Date();

    // ── 1. Fetch all projects with tasks + members ──────────────────────────────
    const projects = await prisma.project.findMany({
        include: {
            tasks: true,
            members: {
                include: { user: true },
            },
        },
    });

    // ── 2. Flatten tasks ────────────────────────────────────────────────────────
    const allTasks = projects.flatMap((p) => p.tasks);

    // ── 3. Project counts ───────────────────────────────────────────────────────
    const totalProjects     = projects.length;
    const activeProjects    = projects.filter((p) => p.status === "active").length;
    const completedProjects = projects.filter((p) => p.status === "completed").length;
    const archivedProjects  = projects.filter((p) => p.status === "archived").length;

    // ── 4. Task status breakdown ────────────────────────────────────────────────
    const tasksByStatus = {
        todo:        allTasks.filter((t) => t.status === "todo").length,
        in_progress: allTasks.filter((t) => t.status === "in_progress").length,
        done:        allTasks.filter((t) => t.status === "done").length,
    };
    const totalTasks = allTasks.length;

    // ── 5. Task priority breakdown ──────────────────────────────────────────────
    const tasksByPriority = {
        low:    allTasks.filter((t) => t.priority === "low").length,
        medium: allTasks.filter((t) => t.priority === "medium").length,
        high:   allTasks.filter((t) => t.priority === "high").length,
        urgent: allTasks.filter((t) => t.priority === "urgent").length,
    };

    // ── 6. Overall progress ─────────────────────────────────────────────────────
    const overallProgress = totalTasks === 0
        ? 0
        : Math.round((tasksByStatus.done / totalTasks) * 100);

    // ── 7. Completion rate this week ────────────────────────────────────────────
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const tasksThisWeek = allTasks.filter(
        (t) => t.updatedAt && new Date(t.updatedAt) >= oneWeekAgo
    );
    const doneThisWeek = tasksThisWeek.filter((t) => t.status === "done").length;
    const completionRate = tasksThisWeek.length === 0
        ? 0
        : Math.round((doneThisWeek / tasksThisWeek.length) * 100);

    // ── 8. Avg tasks per project ────────────────────────────────────────────────
    const avgTasksPerProject = totalProjects === 0
        ? 0
        : Math.round(totalTasks / totalProjects);

    // ── 9. Unique team members ──────────────────────────────────────────────────
    const uniqueMemberIds = new Set(
        projects.flatMap((p) => p.members.map((m) => m.userId))
    );
    const teamMembers = uniqueMemberIds.size;

    // ── 10. Overdue tasks → link to /projects/[id] ───────────────────────────────
    const overdueTasks: OverdueTask[] = allTasks
        .filter((t) => t.dueDate && new Date(t.dueDate) < now && t.status !== "done")
        .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
        .slice(0, 5)
        .map((t) => {
            const project = projects.find((p) => p.id === t.projectId)!;
            const daysOverdue = Math.floor(
                (now.getTime() - new Date(t.dueDate!).getTime()) / (1000 * 60 * 60 * 24)
            );
            const assigneeMember = project.members.find((m) => m.userId === t.assigneeId);
            const assigneeName =
                assigneeMember?.user?.fullName ??
                assigneeMember?.user?.email ??
                undefined;

            return {
                id: t.id,
                title: t.title,
                projectId: project.id,
                projectName: project.name,
                projectColor: project.color ?? "#6366f1",
                dueDate: t.dueDate!.toISOString(),
                priority: (t.priority ?? "medium") as OverdueTask["priority"],
                assignee: assigneeName,
                daysOverdue,
            };
        });

    // ── 11. Top projects ─────────────────────────────────────────────────────────
    const topProjects: TopProject[] = [...projects]
        .sort((a, b) => b.tasks.length - a.tasks.length)
        .slice(0, 4)
        .map((p) => ({
            id: p.id,
            name: p.name,
            color: p.color ?? "#6366f1",
            icon: p.icon ?? "📁",
            taskCount: p.tasks.length,
            tasksCompleted: p.tasks.filter((t) => t.status === "done").length,
            status: p.status ?? "active",
        }));

    // ── 12. Recent activity → all hrefs point to /projects/[id] ─────────────────
    type RawItem = { date: Date; item: ActivityItem };
    const activityPool: RawItem[] = [];

    // Completed tasks
    allTasks
        .filter((t) => t.status === "done" && t.updatedAt)
        .forEach((t) => {
            const project = projects.find((p) => p.id === t.projectId);
            activityPool.push({
                date: new Date(t.updatedAt!),
                item: {
                    id: `task-done-${t.id}`,
                    type: "task_done",
                    label: t.title,
                    sub: project?.name ?? "Unknown project",
                    time: formatRelativeTime(new Date(t.updatedAt!), now),
                    href: `/projects/${t.projectId}`,
                },
            });
        });

    // Created projects
    projects
        .filter((p) => p.createdAt)
        .forEach((p) => {
            activityPool.push({
                date: new Date(p.createdAt!),
                item: {
                    id: `project-created-${p.id}`,
                    type: "project_created",
                    label: p.name,
                    sub: `${p.tasks.length} task${p.tasks.length !== 1 ? "s" : ""}`,
                    time: formatRelativeTime(new Date(p.createdAt!), now),
                    href: `/projects/${p.id}`,
                },
            });
        });

    // Created tasks (not done)
    allTasks
        .filter((t) => t.status !== "done" && t.createdAt)
        .forEach((t) => {
            const project = projects.find((p) => p.id === t.projectId);
            activityPool.push({
                date: new Date(t.createdAt!),
                item: {
                    id: `task-created-${t.id}`,
                    type: "task_created",
                    label: t.title,
                    sub: project?.name ?? "Unknown project",
                    time: formatRelativeTime(new Date(t.createdAt!), now),
                    href: `/projects/${t.projectId}`,
                },
            });
        });

    const recentActivity: ActivityItem[] = activityPool
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, 6)
        .map((r) => r.item);

    return {
        totalProjects,
        activeProjects,
        completedProjects,
        archivedProjects,
        totalTasks,
        tasksByStatus,
        tasksByPriority,
        overallProgress,
        completionRate,
        avgTasksPerProject,
        teamMembers,
        overdueTasks,
        recentActivity,
        topProjects,
    };
}

// ── Helper ────────────────────────────────────────────────────────────────────

function formatRelativeTime(date: Date, now: Date): string {
    const diffMs    = now.getTime() - date.getTime();
    const diffMins  = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays  = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1)   return "Just now";
    if (diffMins < 60)  return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7)   return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}