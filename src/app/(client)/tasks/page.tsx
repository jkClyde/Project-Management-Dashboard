"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
    CheckSquare,
    Clock,
    Flag,
    FolderKanban,
    Search,
    SlidersHorizontal,
    Calendar,
    AlertTriangle,
    CircleDot,
    CheckCircle2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyTasks } from "@/hooks/useMyTasks";        // ← hook you'll create
import TaskDetailModal from "@/components/TaskDetailModal";
import { TaskDetail, TaskStatus, TaskPriority } from "@/types/task";

// ─── Config ───────────────────────────────────────────────────────────────────

type FilterTab = "all" | TaskStatus;

const STATUS_META: Record<TaskStatus, { label: string; cls: string; icon: React.ElementType }> = {
    todo:        { label: "To Do",       cls: "bg-slate-500/10 text-slate-400 border-slate-500/20",  icon: CircleDot },
    in_progress: { label: "In Progress", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20",  icon: Clock },
    done:        { label: "Done",        cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: CheckCircle2 },
};

const PRIORITY_META: Record<TaskPriority, { label: string; dot: string; textCls: string }> = {
    low:    { label: "Low",    dot: "bg-sky-400",    textCls: "text-sky-400" },
    medium: { label: "Medium", dot: "bg-yellow-400", textCls: "text-yellow-400" },
    high:   { label: "High",   dot: "bg-orange-400", textCls: "text-orange-400" },
    urgent: { label: "Urgent", dot: "bg-red-400",    textCls: "text-red-400" },
};

const SORT_OPTIONS = [
    { value: "due",      label: "Due date" },
    { value: "priority", label: "Priority" },
    { value: "updated",  label: "Last updated" },
    { value: "project",  label: "Project" },
];

const PRIORITY_ORDER: Record<TaskPriority, number> = {
    urgent: 0, high: 1, medium: 2, low: 3,
};

function getInitials(name?: string | null) {
    if (!name) return "?";
    return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function TaskRowSkeleton() {
    return (
        <div className="flex items-center gap-4 px-4 py-3 border-b border-border/50">
            <Skeleton className="w-4 h-4 rounded" />
            <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-1/2" />
                <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-14 rounded-full hidden sm:block" />
            <Skeleton className="h-3 w-20 hidden md:block" />
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MyTasksPage() {
    const [tab, setTab] = useState<FilterTab>("all");
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState("due");
    const [selectedTask, setSelectedTask] = useState<TaskDetail | null>(null);

    const { tasks, loading, error, updateTask, deleteTask, addComment, deleteComment } = useMyTasks();

    // ── Derived stats ────────────────────────────────────────────────────────────
    const totalTasks    = tasks.length;
    const todoDasks     = tasks.filter((t) => t.status === "todo").length;
    const inProgress    = tasks.filter((t) => t.status === "in_progress").length;
    const done          = tasks.filter((t) => t.status === "done").length;
    const overdue       = tasks.filter(
        (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "done"
    ).length;

    // ── Filter + sort ────────────────────────────────────────────────────────────
    const filtered = useMemo(() => {
        let list = [...tasks];

        if (tab !== "all") list = list.filter((t) => t.status === tab);

        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(
                (t) =>
                    t.title.toLowerCase().includes(q) ||
                    t.projectName.toLowerCase().includes(q) ||
                    t.description?.toLowerCase().includes(q)
            );
        }

        list.sort((a, b) => {
            switch (sort) {
                case "priority":
                    return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
                case "project":
                    return a.projectName.localeCompare(b.projectName);
                case "updated":
                    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
                case "due":
                default: {
                    if (!a.dueDate && !b.dueDate) return 0;
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                }
            }
        });

        return list;
    }, [tasks, tab, search, sort]);

    // ── Render ───────────────────────────────────────────────────────────────────

    return (
        <div className="space-y-5">

            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
                        <CheckSquare size={22} className="text-primary" />
                        My Tasks
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        All tasks assigned to you across every project
                    </p>
                </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                    { label: "Total",       value: totalTasks, accent: "text-foreground",   icon: CheckSquare,    bg: "bg-muted" },
                    { label: "In Progress", value: inProgress, accent: "text-amber-400",    icon: Clock,          bg: "bg-amber-500/10" },
                    { label: "Completed",   value: done,       accent: "text-emerald-400",  icon: CheckCircle2,   bg: "bg-emerald-500/10" },
                    { label: "Overdue",     value: overdue,    accent: "text-red-400",      icon: AlertTriangle,  bg: "bg-red-500/10" },
                ].map(({ label, value, accent, icon: Icon, bg }) => (
                    <div
                        key={label}
                        className="bg-primary-foreground rounded-xl border border-border/50 p-4 flex items-center gap-3"
                    >
                        <div className={`${bg} rounded-lg p-2.5 shrink-0`}>
                            <Icon size={16} className={accent} />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">{label}</p>
                            <p className={`text-2xl font-bold leading-tight ${accent}`}>{value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters bar */}
            <div className="bg-primary-foreground rounded-xl border border-border/50 p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <Tabs value={tab} onValueChange={(v) => setTab(v as FilterTab)}>
                    <TabsList className="h-8">
                        <TabsTrigger value="all"         className="text-xs px-3">All</TabsTrigger>
                        <TabsTrigger value="todo"        className="text-xs px-3">To Do</TabsTrigger>
                        <TabsTrigger value="in_progress" className="text-xs px-3">In Progress</TabsTrigger>
                        <TabsTrigger value="done"        className="text-xs px-3">Done</TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-52">
                        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search tasks…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-8 h-8 text-sm"
                        />
                    </div>
                    <Select value={sort} onValueChange={setSort}>
                        <SelectTrigger className="h-8 w-36 text-xs gap-1">
                            <SlidersHorizontal size={12} />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {SORT_OPTIONS.map((o) => (
                                <SelectItem key={o.value} value={o.value} className="text-xs">
                                    {o.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg px-4 py-3">
                    {error}
                </div>
            )}

            {/* Task table */}
            <div className="bg-primary-foreground rounded-xl border border-border/50 overflow-hidden">
                {loading ? (
                    <>
                        {Array.from({ length: 6 }).map((_, i) => <TaskRowSkeleton key={i} />)}
                    </>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <span className="text-4xl mb-3 opacity-40">✅</span>
                        <h3 className="text-sm font-medium text-foreground mb-1">
                            {search ? "No tasks match your search" : tab === "all" ? "No tasks assigned to you" : `No ${STATUS_META[tab as TaskStatus]?.label} tasks`}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            {search ? "Try a different search term" : "Tasks assigned to you will appear here"}
                        </p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                        <tr className="border-b border-border/50 bg-muted/30">
                            <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Task</th>
                            <th className="text-left px-3 py-2.5 text-xs font-medium text-muted-foreground hidden sm:table-cell">Project</th>
                            <th className="text-left px-3 py-2.5 text-xs font-medium text-muted-foreground hidden md:table-cell">Status</th>
                            <th className="text-left px-3 py-2.5 text-xs font-medium text-muted-foreground hidden md:table-cell">Priority</th>
                            <th className="text-left px-3 py-2.5 text-xs font-medium text-muted-foreground hidden lg:table-cell">Due</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                        {filtered.map((task) => {
                            const statusMeta   = STATUS_META[task.status];
                            const priorityMeta = PRIORITY_META[task.priority];
                            const isOverdueRow = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done";

                            return (
                                <tr
                                    key={task.id}
                                    onClick={() => setSelectedTask(task)}
                                    className="hover:bg-muted/20 cursor-pointer transition-colors group"
                                >
                                    {/* Title */}
                                    <td className="px-4 py-3">
                                        <p className="font-medium text-foreground group-hover:text-primary transition-colors truncate max-w-[240px]">
                                            {task.title}
                                        </p>
                                        {task.description && (
                                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                                {task.description}
                                            </p>
                                        )}
                                    </td>

                                    {/* Project */}
                                    <td className="px-3 py-3 hidden sm:table-cell">
                                        <Link
                                            href={`/projects/${task.projectId}`}
                                            onClick={(e) => e.stopPropagation()}
                                            className="flex items-center gap-1.5 hover:underline"
                                        >
                                            <div className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: task.projectColor }} />
                                            <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                          {task.projectName}
                        </span>
                                        </Link>
                                    </td>

                                    {/* Status */}
                                    <td className="px-3 py-3 hidden md:table-cell">
                                        <Badge variant="outline" className={`text-[10px] px-1.5 ${statusMeta.cls}`}>
                                            {statusMeta.label}
                                        </Badge>
                                    </td>

                                    {/* Priority */}
                                    <td className="px-3 py-3 hidden md:table-cell">
                                        <div className="flex items-center gap-1.5">
                                            <span className={`w-2 h-2 rounded-full ${priorityMeta.dot}`} />
                                            <span className={`text-xs ${priorityMeta.textCls}`}>{priorityMeta.label}</span>
                                        </div>
                                    </td>

                                    {/* Due */}
                                    <td className="px-3 py-3 hidden lg:table-cell">
                                        {task.dueDate ? (
                                            <span className={`text-xs flex items-center gap-1 ${isOverdueRow ? "text-red-400" : "text-muted-foreground"}`}>
                          {isOverdueRow && <AlertTriangle size={10} />}
                                                {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
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

            {/* Footer count */}
            {!loading && filtered.length > 0 && (
                <p className="text-xs text-muted-foreground text-center pt-1">
                    Showing {filtered.length} of {tasks.length} task{tasks.length !== 1 ? "s" : ""}
                </p>
            )}

            {/* Task detail modal */}
            <TaskDetailModal
                task={selectedTask}
                open={!!selectedTask}
                onClose={() => setSelectedTask(null)}
                onUpdate={async (id, updates) => {
                    await updateTask(id, updates);
                    setSelectedTask((prev) => prev ? { ...prev, ...updates } : null);
                }}
                onDelete={async (id) => {
                    await deleteTask(id);
                    setSelectedTask(null);
                }}
                onAddComment={async (id, body) => {
                    await addComment(id, body);
                }}
                onDeleteComment={async (id, commentId) => {
                    await deleteComment(id, commentId);
                }}
            />
        </div>
    );
}