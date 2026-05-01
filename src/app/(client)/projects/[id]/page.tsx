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
    Clock,
    AlertTriangle,
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
type TaskPriority = "low" | "medium" | "high" | "urgent";
type ProjectStatus = "active" | "completed" | "archived";

function getInitials(name?: string | null) {
    if (!name) return "?";
    return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function getTaskStatus(status?: string | null): TaskStatus {
    if (status === "todo" || status === "in_progress" || status === "done") return status;
    return "todo";
}

function getProjectStatus(status?: string | null): ProjectStatus {
    if (status === "active" || status === "completed" || status === "archived") return status;
    return "active";
}

const PROJECT_STATUS_CONFIG: Record<ProjectStatus, { label: string; className: string }> = {
    active:    { label: "Active",    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    completed: { label: "Completed", className: "bg-primary/10 text-primary border-primary/20" },
    archived:  { label: "Archived",  className: "bg-muted text-muted-foreground border-border" },
};

const LIST_STATUS_LABEL: Record<TaskStatus, string> = {
    todo:        "To Do",
    in_progress: "In Progress",
    done:        "Done",
};

const LIST_STATUS_COLOR: Record<TaskStatus, string> = {
    todo:        "bg-slate-500/10 text-slate-400 border-slate-500/20",
    in_progress: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    done:        "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

const PRIORITY_CONFIG: Record<TaskPriority, { dot: string; textCls: string; label: string }> = {
    low:    { dot: "bg-sky-400",    textCls: "text-sky-400",    label: "Low" },
    medium: { dot: "bg-yellow-400", textCls: "text-yellow-400", label: "Medium" },
    high:   { dot: "bg-orange-400", textCls: "text-orange-400", label: "High" },
    urgent: { dot: "bg-red-400",    textCls: "text-red-400",    label: "Urgent" },
};

const STATUS_ORDER: Record<TaskStatus, number> = { todo: 0, in_progress: 1, done: 2 };

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function PageSkeleton() {
    return (
        <div className="space-y-5">
            <Skeleton className="h-4 w-48" />
            <div className="bg-primary-foreground rounded-xl border border-border/50 overflow-hidden">
                <Skeleton className="h-1.5 w-full rounded-none" />
                <div className="p-6 space-y-5">
                    <div className="flex items-center gap-4">
                        <Skeleton className="w-14 h-14 rounded-xl shrink-0" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-6 w-56" />
                            <Skeleton className="h-4 w-80" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => (
                            <Skeleton key={i} className="h-20 rounded-xl" />
                        ))}
                    </div>
                    <Skeleton className="h-4 w-full rounded-full" />
                </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-primary-foreground rounded-xl border border-border/50 p-4 space-y-3">
                        <Skeleton className="h-5 w-24" />
                        {[...Array(2)].map((_, j) => (
                            <Skeleton key={j} className="h-24 rounded-lg" />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProjectDetailPage({
                                              params,
                                          }: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const [view, setView] = useState<"board" | "list">("board");

    const { project, loading, error, createTask, updateTask, moveTask, deleteTask } =
        useProjectDetail(id);

    if (loading) return <PageSkeleton />;

    if (error || !project) {
        return (
            <div className="bg-primary-foreground rounded-xl border border-border/50 flex flex-col items-center justify-center py-20 text-center">
                <span className="text-5xl mb-4 opacity-40">⚠️</span>
                <h3 className="text-base font-semibold text-foreground mb-1">Project not found</h3>
                <p className="text-sm text-muted-foreground mb-5">
                    {error ?? "This project doesn't exist or you don't have access."}
                </p>
                <Button variant="outline" size="sm" asChild>
                    <Link href="/projects">Back to projects</Link>
                </Button>
            </div>
        );
    }

    const totalTasks     = project.tasks.length;
    const completedTasks = project.tasks.filter((t) => getTaskStatus(t.status) === "done").length;
    const inProgressTasks = project.tasks.filter((t) => getTaskStatus(t.status) === "in_progress").length;
    const todoTasks      = project.tasks.filter((t) => getTaskStatus(t.status) === "todo").length;
    const overdueTasks   = project.tasks.filter(
        (t) => t.dueDate && new Date(t.dueDate) < new Date() && getTaskStatus(t.status) !== "done"
    ).length;
    const progressPct    = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

    const projectStatus = getProjectStatus(project.status);
    const statusCfg     = PROJECT_STATUS_CONFIG[projectStatus];
    const projectColor  = project.color ?? "#6366f1";
    const projectIcon   = project.icon ?? "📁";
    const updatedAt     = project.updatedAt ?? new Date();

    const listTasks = [...project.tasks].sort(
        (a, b) => STATUS_ORDER[getTaskStatus(a.status)] - STATUS_ORDER[getTaskStatus(b.status)]
    );

    return (
        <div className="space-y-5">

            {/* ── Breadcrumb ── */}
            <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Link href="/projects" className="hover:text-foreground transition-colors">
                    Projects
                </Link>
                <ChevronRight size={14} />
                <span className="text-foreground font-medium truncate max-w-[240px]">
                    {project.name}
                </span>
            </nav>

            {/* ── Project header card ── */}
            <div className="bg-primary-foreground rounded-xl border border-border/50 overflow-hidden">
                <div className="h-1.5 w-full" style={{ backgroundColor: projectColor }} />

                <div className="p-6 space-y-5">

                    {/* Title row */}
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                            <div
                                className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0"
                                style={{
                                    backgroundColor: `${projectColor}1a`,
                                    border: `1px solid ${projectColor}33`,
                                }}
                            >
                                {projectIcon}
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2.5 flex-wrap">
                                    <h1 className="text-xl font-semibold text-foreground">
                                        {project.name}
                                    </h1>
                                    <Badge variant="outline" className={`text-xs ${statusCfg.className}`}>
                                        {statusCfg.label}
                                    </Badge>
                                </div>
                                {project.description && (
                                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                        {project.description}
                                    </p>
                                )}
                            </div>
                        </div>
                        <Button variant="outline" size="sm" className="gap-1.5 h-9 shrink-0" asChild>
                            <Link href={`/projects/${id}/settings`}>
                                <Settings size={14} />
                                Settings
                            </Link>
                        </Button>
                    </div>

                    {/* Stat mini-cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                            {
                                icon: <CheckSquare size={15} className="text-muted-foreground" />,
                                label: "Total tasks",
                                value: totalTasks,
                                valueClass: "text-foreground",
                            },
                            {
                                icon: <Clock size={15} className="text-amber-400" />,
                                label: "In progress",
                                value: inProgressTasks,
                                valueClass: "text-amber-400",
                            },
                            {
                                icon: <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />,
                                label: "Completed",
                                value: completedTasks,
                                valueClass: "text-emerald-400",
                            },
                            {
                                icon: <Users size={15} className="text-muted-foreground" />,
                                label: "Members",
                                value: project.members.length,
                                valueClass: "text-foreground",
                            },
                        ].map(({ icon, label, value, valueClass }) => (
                            <div
                                key={label}
                                className="bg-background rounded-xl p-4 border border-border/50 space-y-1.5"
                            >
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    {icon}
                                    <span className="text-xs">{label}</span>
                                </div>
                                <p className={`text-2xl font-bold ${valueClass}`}>{value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Progress + overdue + members */}
                    <div className="flex items-center gap-5 flex-wrap">
                        <div className="flex-1 min-w-[180px] space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Overall progress</span>
                                <span className="text-sm font-semibold text-foreground">{progressPct}%</span>
                            </div>
                            <Progress value={progressPct} className="h-2" />
                            <p className="text-xs text-muted-foreground">
                                {completedTasks} of {totalTasks} tasks completed
                            </p>
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                            {overdueTasks > 0 && (
                                <div className="flex items-center gap-1.5 text-red-400">
                                    <AlertTriangle size={14} />
                                    <span className="text-sm font-medium">{overdueTasks} overdue</span>
                                </div>
                            )}

                            <div className="flex -space-x-2.5">
                                {project.members.slice(0, 5).map(({ user }) => (
                                    <Avatar key={user.id} className="w-8 h-8 border-2 border-primary-foreground">
                                        <AvatarImage src={user.avatarUrl ?? undefined} />
                                        <AvatarFallback className="text-[10px] bg-primary/20 text-primary">
                                            {getInitials(user.fullName)}
                                        </AvatarFallback>
                                    </Avatar>
                                ))}
                                {project.members.length > 5 && (
                                    <div className="w-8 h-8 rounded-full bg-muted border-2 border-primary-foreground flex items-center justify-center">
                                        <span className="text-[10px] text-muted-foreground font-medium">
                                            +{project.members.length - 5}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <Calendar size={13} />
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

            {/* ── View toggle ── */}
            <div className="flex items-center justify-between">
                <Tabs value={view} onValueChange={(v) => setView(v as "board" | "list")}>
                    <TabsList className="h-9">
                        <TabsTrigger value="board" className="text-sm gap-1.5 px-4">
                            <LayoutGrid size={14} /> Board
                        </TabsTrigger>
                        <TabsTrigger value="list" className="text-sm gap-1.5 px-4">
                            <List size={14} /> List
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
                <p className="text-sm text-muted-foreground">
                    {totalTasks} task{totalTasks !== 1 ? "s" : ""}
                </p>
            </div>

            {/* ── Board view ── */}
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

            {/* ── List view ── */}
            {view === "list" && (
                <div className="bg-primary-foreground rounded-xl border border-border/50 overflow-hidden">
                    {listTasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <span className="text-4xl mb-3 opacity-40">✅</span>
                            <p className="text-sm font-medium text-foreground mb-1">No tasks yet</p>
                            <p className="text-sm text-muted-foreground">
                                Add your first task from the board view
                            </p>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                            <tr className="border-b border-border/50 bg-muted/30">
                                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Task</th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">Status</th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Priority</th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">Assignee</th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">Due</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40">
                            {listTasks.map((task) => {
                                const taskStatus   = getTaskStatus(task.status);
                                const taskPriority = (task.priority ?? "medium") as TaskPriority;
                                const priorityCfg  = PRIORITY_CONFIG[taskPriority];
                                const isOverdue    =
                                    task.dueDate &&
                                    new Date(task.dueDate) < new Date() &&
                                    taskStatus !== "done";

                                return (
                                    <tr
                                        key={task.id}
                                        className="hover:bg-muted/20 transition-colors group"
                                    >
                                        {/* Title */}
                                        <td className="px-5 py-3.5">
                                            <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                                                {task.title}
                                            </p>
                                            {task.description && (
                                                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                                    {task.description}
                                                </p>
                                            )}
                                        </td>

                                        {/* Status */}
                                        <td className="px-4 py-3.5 hidden sm:table-cell">
                                            <Badge
                                                variant="outline"
                                                className={`text-[11px] px-2 ${LIST_STATUS_COLOR[taskStatus]}`}
                                            >
                                                {LIST_STATUS_LABEL[taskStatus]}
                                            </Badge>
                                        </td>

                                        {/* Priority */}
                                        <td className="px-4 py-3.5 hidden md:table-cell">
                                            <div className="flex items-center gap-1.5">
                                                <span className={`w-2 h-2 rounded-full ${priorityCfg.dot}`} />
                                                <span className={`text-xs ${priorityCfg.textCls}`}>
                                                        {priorityCfg.label}
                                                    </span>
                                            </div>
                                        </td>

                                        {/* Assignee */}
                                        <td className="px-4 py-3.5 hidden lg:table-cell">
                                            {task.assignee ? (
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="w-6 h-6">
                                                        <AvatarImage src={task.assignee.avatarUrl ?? undefined} />
                                                        <AvatarFallback className="text-[9px] bg-primary/20 text-primary">
                                                            {getInitials(task.assignee.fullName)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-sm text-muted-foreground">
                                                            {task.assignee.fullName ?? "Unnamed"}
                                                        </span>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-muted-foreground">—</span>
                                            )}
                                        </td>

                                        {/* Due */}
                                        <td className="px-4 py-3.5 hidden lg:table-cell">
                                            {task.dueDate ? (
                                                <span className={`text-sm flex items-center gap-1 ${isOverdue ? "text-red-400" : "text-muted-foreground"}`}>
                                                        {isOverdue && <AlertTriangle size={11} />}
                                                    {new Date(task.dueDate).toLocaleDateString("en-US", {
                                                        month: "short",
                                                        day: "numeric",
                                                    })}
                                                    </span>
                                            ) : (
                                                <span className="text-sm text-muted-foreground">—</span>
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