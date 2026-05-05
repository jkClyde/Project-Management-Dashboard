import { FolderKanban, CheckCircle2, CircleDot, Flame } from "lucide-react";

import {
    StatCard,
    TaskStatusBar,
    PriorityBreakdown,
    OverdueTasks,
    RecentActivity,
    OverallProgress,
    TopProjects,
} from "@/components/dashboard";
import { fetchDashboardStats } from "@/lib/actions/fetchDashboardStats";

export default async function Homepage() {
    const stats = await fetchDashboardStats();

    const totalTasks =
        stats.tasksByStatus.todo +
        stats.tasksByStatus.in_progress +
        stats.tasksByStatus.done;

    return (
        <div className="space-y-5">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                    Here's what's happening across your projects.
                </p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={FolderKanban}
                    label="Total Projects"
                    value={stats.totalProjects}
                    sub={`${stats.activeProjects} active · ${stats.completedProjects} completed`}
                    accent="text-violet-600 dark:text-violet-400"
                    iconBg="bg-violet-500/10"
                    iconColor="text-violet-600 dark:text-violet-400"
                    stripeColor="#7F77DD"
                    trend={{ value: `${stats.archivedProjects} archived`, positive: false }}
                    href="/projects"
                />
                <StatCard
                    icon={CircleDot}
                    label="Total Tasks"
                    value={totalTasks}
                    sub={`${stats.tasksByStatus.in_progress} in progress`}
                    accent="text-sky-600 dark:text-sky-400"
                    iconBg="bg-sky-500/10"
                    iconColor="text-sky-600 dark:text-sky-400"
                    stripeColor="#378ADD"
                    trend={{ value: `${stats.tasksByStatus.todo} pending`, positive: false }}
                    href="/projects"
                />
                <StatCard
                    icon={CheckCircle2}
                    label="Completed Tasks"
                    value={stats.tasksByStatus.done}
                    sub={`${totalTasks ? Math.round((stats.tasksByStatus.done / totalTasks) * 100) : 0}% completion rate`}
                    accent="text-emerald-600 dark:text-emerald-400"
                    iconBg="bg-emerald-500/10"
                    iconColor="text-emerald-600 dark:text-emerald-400"
                    stripeColor="#1D9E75"
                    trend={{ value: `${stats.completionRate}% this week`, positive: stats.completionRate >= 50 }}
                    href="/projects"
                />
                <StatCard
                    icon={Flame}
                    label="Urgent Tasks"
                    value={stats.tasksByPriority.urgent}
                    sub={`${stats.tasksByPriority.high} high priority too`}
                    accent="text-red-600 dark:text-red-400"
                    iconBg="bg-red-500/10"
                    iconColor="text-red-600 dark:text-red-400"
                    stripeColor="#E24B4A"
                    trend={{ value: "Need attention", positive: false }}
                    href="/projects"
                />
            </div>

            {/* Row 2: Overall progress + Task status + Priority */}
            <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4">
                <OverallProgress
                    pct={stats.overallProgress}
                    totalProjects={stats.totalProjects}
                    activeProjects={stats.activeProjects}
                    teamMembers={stats.teamMembers}
                    avgTasksPerProject={stats.avgTasksPerProject}
                />
                <TaskStatusBar
                    tasksByStatus={stats.tasksByStatus}
                    total={totalTasks}
                    completionRate={stats.completionRate}
                />
                <PriorityBreakdown
                    tasksByPriority={stats.tasksByPriority}
                    total={totalTasks}
                />
            </div>

            {/* Row 3: Top projects + Overdue + Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4">
                <TopProjects projects={stats.topProjects} />
                <OverdueTasks tasks={stats.overdueTasks} />
                <RecentActivity items={stats.recentActivity} />
            </div>
        </div>
    );
}