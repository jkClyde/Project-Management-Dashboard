// app/projects/[id]/page.tsx
"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
    ChevronRight,
    Users,
    CheckSquare,
    Calendar,
    LayoutGrid,
    List,
    Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProjectDetail } from "@/hooks/useProjectDetail";
import KanbanBoard from "@/components/KanbanBoard";

type TaskStatus = "todo" | "in_progress" | "done";
type ProjectStatus = "active" | "completed" | "archived";

function getInitials(name?: string | null) {
    if (!name) return "?";

    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
}

function getTaskStatus(status?: string | null): TaskStatus {
    if (status === "todo" || status === "in_progress" || status === "done") {
        return status;
    }

    return "todo";
}

function getProjectStatus(status?: string | null): ProjectStatus {
    if (status === "active" || status === "completed" || status === "archived") {
        return status;
    }

    return "active";
}

const statusConfig: Record<
    ProjectStatus,
    {
        label: string;
        className: string;
    }
> = {
    active: {
        label: "Active",
        className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    },
    completed: {
        label: "Completed",
        className: "bg-primary/10 text-primary border-primary/20",
    },
    archived: {
        label: "Archived",
        className: "bg-muted text-muted-foreground border-border",
    },
};

const listStatusLabel: Record<TaskStatus, string> = {
    todo: "To Do",
    in_progress: "In Progress",
    done: "Done",
};

const listStatusColor: Record<TaskStatus, string> = {
    todo: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    in_progress: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    done: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

const statusOrder: Record<TaskStatus, number> = {
    todo: 0,
    in_progress: 1,
    done: 2,
};

function PageSkeleton() {
    return (
        <div className="space-y-4">
            <Skeleton className="h-4 w-48" />
            <div className="bg-primary-foreground rounded-lg border border-border/50 p-5 space-y-4">
                <div className="flex items-center gap-3">
                    <Skeleton className="w-12 h-12 rounded-xl" />
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-3.5 w-72" />
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-16 rounded-lg" />
                    ))}
                </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                    <div
                        key={i}
                        className="bg-primary-foreground rounded-lg border border-border/50 p-3 space-y-2"
                    >
                        <Skeleton className="h-4 w-24" />
                        {[...Array(2)].map((_, j) => (
                            <Skeleton key={j} className="h-20 rounded-lg" />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function ProjectDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const [view, setView] = useState<"board" | "list">("board");

    const {
        project,
        loading,
        error,
        createTask,
        updateTask,
        moveTask,
        deleteTask,
    } = useProjectDetail(id);

    if (loading) return <PageSkeleton />;

    if (error || !project) {
        return (
            <div className="bg-primary-foreground rounded-lg border border-border/50 flex flex-col items-center justify-center py-16 text-center">
                <span className="text-4xl mb-3 opacity-40">⚠️</span>
                <h3 className="text-sm font-medium text-foreground mb-1">
                    Project not found
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                    {error ?? "This project doesn't exist or you don't have access."}
                </p>
                <Button variant="outline" size="sm" asChild>
                    <Link href="/projects">Back to projects</Link>
                </Button>
            </div>
        );
    }

    const totalTasks = project.tasks.length;
    const completedTasks = project.tasks.filter(
        (task) => getTaskStatus(task.status) === "done"
    ).length;
    const inProgressTasks = project.tasks.filter(
        (task) => getTaskStatus(task.status) === "in_progress"
    ).length;
    const progressPct =
        totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

    const projectStatus = getProjectStatus(project.status);
    const status = statusConfig[projectStatus];
    const projectColor = project.color ?? "#6366f1";
    const projectIcon = project.icon ?? "📁";
    const updatedAt = project.updatedAt ?? new Date();

    const sortedTasks = [...project.tasks].sort((a, b) => {
        const aUpdated = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const bUpdated = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;

        return bUpdated - aUpdated;
    });

    const listTasks = sortedTasks.sort(
        (a, b) => statusOrder[getTaskStatus(a.status)] - statusOrder[getTaskStatus(b.status)]
    );

    return (
        <div className="space-y-4">
            <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Link href="/projects" className="hover:text-foreground transition-colors">
                    Projects
                </Link>
                <ChevronRight size={14} />
                <span className="text-foreground font-medium truncate max-w-[200px]">
                    {project.name}
                </span>
            </nav>

            <div className="bg-primary-foreground rounded-lg border border-border/50 overflow-hidden">
                <div className="h-1.5 w-full" style={{ backgroundColor: projectColor }} />

                <div className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                            <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                                style={{
                                    backgroundColor: `${projectColor}1a`,
                                    border: `1px solid ${projectColor}33`,
                                }}
                            >
                                {projectIcon}
                            </div>

                            <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h1 className="text-lg font-semibold text-foreground">
                                        {project.name}
                                    </h1>
                                    <Badge
                                        variant="outline"
                                        className={`text-[11px] ${status.className}`}
                                    >
                                        {status.label}
                                    </Badge>
                                </div>

                                {project.description && (
                                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                                        {project.description}
                                    </p>
                                )}
                            </div>
                        </div>

                        <Button variant="outline" size="sm" className="gap-1.5 shrink-0" asChild>
                            <Link href={`/projects/${id}/settings`}>
                                <Settings size={13} />
                                Settings
                            </Link>
                        </Button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-background rounded-lg p-3 border border-border/50">
                            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                                <CheckSquare size={13} />
                                <span className="text-xs">Tasks</span>
                            </div>
                            <p className="text-xl font-bold text-foreground">{totalTasks}</p>
                        </div>

                        <div className="bg-background rounded-lg p-3 border border-border/50">
                            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                                <span className="w-2 h-2 rounded-full bg-amber-400" />
                                <span className="text-xs">In progress</span>
                            </div>
                            <p className="text-xl font-bold text-foreground">
                                {inProgressTasks}
                            </p>
                        </div>

                        <div className="bg-background rounded-lg p-3 border border-border/50">
                            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                <span className="text-xs">Completed</span>
                            </div>
                            <p className="text-xl font-bold text-emerald-400">
                                {completedTasks}
                            </p>
                        </div>

                        <div className="bg-background rounded-lg p-3 border border-border/50">
                            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                                <Users size={13} />
                                <span className="text-xs">Members</span>
                            </div>
                            <p className="text-xl font-bold text-foreground">
                                {project.members.length}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex-1 min-w-[160px] space-y-1.5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">
                                    Overall progress
                                </span>
                                <span className="text-xs font-medium text-foreground">
                                    {progressPct}%
                                </span>
                            </div>
                            <Progress value={progressPct} className="h-1.5" />
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex -space-x-2">
                                {project.members.slice(0, 5).map(({ user }) => (
                                    <Avatar
                                        key={user.id}
                                        className="w-7 h-7 border-2 border-primary-foreground"
                                    >
                                        <AvatarImage src={user.avatarUrl ?? undefined} />
                                        <AvatarFallback className="text-[10px] bg-primary/20 text-primary">
                                            {getInitials(user.fullName)}
                                        </AvatarFallback>
                                    </Avatar>
                                ))}

                                {project.members.length > 5 && (
                                    <div className="w-7 h-7 rounded-full bg-muted border-2 border-primary-foreground flex items-center justify-center">
                                        <span className="text-[10px] text-muted-foreground">
                                            +{project.members.length - 5}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar size={12} />
                                Updated{" "}
                                {new Date(updatedAt).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between">
                <Tabs value={view} onValueChange={(value) => setView(value as "board" | "list")}>
                    <TabsList className="h-8">
                        <TabsTrigger value="board" className="text-xs gap-1.5 px-3">
                            <LayoutGrid size={13} /> Board
                        </TabsTrigger>
                        <TabsTrigger value="list" className="text-xs gap-1.5 px-3">
                            <List size={13} /> List
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                <p className="text-xs text-muted-foreground">
                    {totalTasks} task{totalTasks !== 1 ? "s" : ""}
                </p>
            </div>

            {view === "board" && (
                <KanbanBoard
                    tasks={project.tasks}
                    members={project.members}
                    onCreateTask={createTask}
                    onUpdateTask={updateTask}
                    onMoveTask={moveTask}
                    onDeleteTask={deleteTask}
                />
            )}

            {view === "list" && (
                <div className="bg-primary-foreground rounded-lg border border-border/50 overflow-hidden">
                    {listTasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <span className="text-3xl mb-2 opacity-40">✅</span>
                            <p className="text-sm text-muted-foreground">No tasks yet</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border/50 bg-muted/30">
                                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                                        Task
                                    </th>
                                    <th className="text-left px-3 py-2.5 text-xs font-medium text-muted-foreground hidden sm:table-cell">
                                        Status
                                    </th>
                                    <th className="text-left px-3 py-2.5 text-xs font-medium text-muted-foreground hidden md:table-cell">
                                        Priority
                                    </th>
                                    <th className="text-left px-3 py-2.5 text-xs font-medium text-muted-foreground hidden lg:table-cell">
                                        Assignee
                                    </th>
                                    <th className="text-left px-3 py-2.5 text-xs font-medium text-muted-foreground hidden lg:table-cell">
                                        Due
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-border/50">
                                {listTasks.map((task) => {
                                    const taskStatus = getTaskStatus(task.status);

                                    return (
                                        <tr
                                            key={task.id}
                                            className="hover:bg-muted/20 transition-colors"
                                        >
                                            <td className="px-4 py-3">
                                                <p className="font-medium text-foreground text-sm">
                                                    {task.title}
                                                </p>

                                                {task.description && (
                                                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                                        {task.description}
                                                    </p>
                                                )}
                                            </td>

                                            <td className="px-3 py-3 hidden sm:table-cell">
                                                <Badge
                                                    variant="outline"
                                                    className={`text-[10px] px-1.5 ${listStatusColor[taskStatus]}`}
                                                >
                                                    {listStatusLabel[taskStatus]}
                                                </Badge>
                                            </td>

                                            <td className="px-3 py-3 hidden md:table-cell">
                                                <span className="text-xs text-muted-foreground capitalize">
                                                    {task.priority ?? "medium"}
                                                </span>
                                            </td>

                                            <td className="px-3 py-3 hidden lg:table-cell">
                                                {task.assignee ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <Avatar className="w-5 h-5">
                                                            <AvatarImage
                                                                src={task.assignee.avatarUrl ?? undefined}
                                                            />
                                                            <AvatarFallback className="text-[8px] bg-primary/20 text-primary">
                                                                {getInitials(task.assignee.fullName)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <span className="text-xs text-muted-foreground">
                                                            {task.assignee.fullName ?? "Unnamed"}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">—</span>
                                                )}
                                            </td>

                                            <td className="px-3 py-3 hidden lg:table-cell">
                                                {task.dueDate ? (
                                                    <span
                                                        className={`text-xs ${new Date(task.dueDate) < new Date()
                                                                ? "text-red-400"
                                                                : "text-muted-foreground"
                                                            }`}
                                                    >
                                                        {new Date(task.dueDate).toLocaleDateString("en-US", {
                                                            month: "short",
                                                            day: "numeric",
                                                        })}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
}