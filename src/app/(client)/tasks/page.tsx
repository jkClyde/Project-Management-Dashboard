"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
    CheckSquare,
    Clock,
    Search,
    SlidersHorizontal,
    AlertTriangle,
    CircleDot,
    CheckCircle2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyTasks } from "@/hooks/useMyTasks";
import TaskDetailModal from "@/components/TaskDetailModal";
import { TaskDetail, TaskStatus, TaskPriority } from "../../../../types/task";

// ─── Config ───────────────────────────────────────────────────────────────────

type FilterTab = "all" | TaskStatus;

const STATUS_META: Record<TaskStatus, { label: string; cls: string; icon: React.ElementType }> = {
    todo:        { label: "To Do",       cls: "bg-slate-500/10 text-slate-400 border-slate-500/20",   icon: CircleDot },
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
        <div className="flex items-center gap-4 px-5 py-4 border-b border-border/50">
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full hidden sm:block" />
            <Skeleton className="h-6 w-16 rounded-full hidden md:block" />
            <Skeleton className="h-4 w-20 hidden lg:block" />
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

    // ── Derived stats ─────────────────────────────────────────────────────────
    const totalTasks = tasks.length;
    const inProgress = tasks.filter((t) => t.status === "in_progress").length;
    const done       = tasks.filter((t) => t.status === "done").length;
    const overdue    = tasks.filter(
        (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "done"
    ).length;

    // ── Filter + sort ─────────────────────────────────────────────────────────
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

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="space-y-6">

            {/* ── Header ── */}
            <div>
                <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
                    <CheckSquare size={24} className="text-primary" />
                    My Tasks
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                    All tasks assigned to you across every project
                </p>
            </div>

            {/* ── Stat cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Total Tasks",  value: totalTasks, sub: `${tasks.filter(t => t.status === "todo").length} to do`, accent: "text-foreground",  icon: CheckSquare,  bg: "bg-muted" },
                    { label: "In Progress",  value: inProgress, sub: "Currently active",    accent: "text-amber-400",  icon: Clock,         bg: "bg-amber-500/10" },
                    { label: "Completed",    value: done,       sub: "All done",             accent: "text-emerald-400",icon: CheckCircle2,  bg: "bg-emerald-500/10" },
                    { label: "Overdue",      value: overdue,    sub: "Need attention",       accent: "text-red-400",    icon: AlertTriangle, bg: "bg-red-500/10" },
                ].map(({ label, value, sub, accent, icon: Icon, bg }) => (
                    <div
                        key={label}
                        className="bg-primary-foreground rounded-xl border border-border/50 p-5 flex items-start gap-4"
                    >
                        <div className={`${bg} rounded-xl p-3 shrink-0`}>
                            <Icon size={22} className={accent} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm text-muted-foreground">{label}</p>
                            <p className={`text-3xl font-bold leading-tight mt-0.5 ${accent}`}>{value}</p>
                            <p className="text-xs text-muted-foreground mt-1">{sub}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Filters bar ── */}
            <div className="bg-primary-foreground rounded-xl border border-border/50 p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <Tabs value={tab} onValueChange={(v) => setTab(v as FilterTab)}>
                    <TabsList className="h-9">
                        <TabsTrigger value="all"         className="text-sm px-4">All</TabsTrigger>
                        <TabsTrigger value="todo"        className="text-sm px-4">To Do</TabsTrigger>
                        <TabsTrigger value="in_progress" className="text-sm px-4">In Progress</TabsTrigger>
                        <TabsTrigger value="done"        className="text-sm px-4">Done</TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-56">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search tasks…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 h-9 text-sm"
                        />
                    </div>
                    <Select value={sort} onValueChange={setSort}>
                        <SelectTrigger className="h-9 w-40 text-sm gap-1.5">
                            <SlidersHorizontal size={13} />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {SORT_OPTIONS.map((o) => (
                                <SelectItem key={o.value} value={o.value} className="text-sm">
                                    {o.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* ── Error ── */}
            {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl px-4 py-3">
                    {error}
                </div>
            )}

            {/* ── Task table ── */}
            <div className="bg-primary-foreground rounded-xl border border-border/50 overflow-hidden">
                {loading ? (
                    <>
                        {Array.from({ length: 6 }).map((_, i) => (
                            <TaskRowSkeleton key={i} />
                        ))}
                    </>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <span className="text-5xl mb-4 opacity-40">✅</span>
                        <h3 className="text-base font-semibold text-foreground mb-1">
                            {search
                                ? "No tasks match your search"
                                : tab === "all"
                                    ? "No tasks assigned to you"
                                    : `No ${STATUS_META[tab as TaskStatus]?.label} tasks`}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            {search
                                ? "Try a different search term"
                                : "Tasks assigned to you will appear here"}
                        </p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                        <tr className="border-b border-border/50 bg-muted/30">
                            <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Task</th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">Project</th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Status</th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Priority</th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">Due</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                        {filtered.map((task) => {
                            const statusMeta   = STATUS_META[task.status];
                            const priorityMeta = PRIORITY_META[task.priority];
                            const isOverdueRow =
                                task.dueDate &&
                                new Date(task.dueDate) < new Date() &&
                                task.status !== "done";

                            return (
                                <tr
                                    key={task.id}
                                    onClick={() => setSelectedTask(task)}
                                    className="hover:bg-muted/20 cursor-pointer transition-colors group"
                                >
                                    {/* Title */}
                                    <td className="px-5 py-4">
                                        <p className="font-medium text-foreground group-hover:text-primary transition-colors truncate max-w-[260px]">
                                            {task.title}
                                        </p>
                                        {task.description && (
                                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                                {task.description}
                                            </p>
                                        )}
                                    </td>

                                    {/* Project */}
                                    <td className="px-4 py-4 hidden sm:table-cell">
                                        <Link
                                            href={`/projects/${task.projectId}`}
                                            onClick={(e) => e.stopPropagation()}
                                            className="flex items-center gap-2 hover:underline"
                                        >
                                            <div
                                                className="w-2.5 h-2.5 rounded-sm shrink-0"
                                                style={{ backgroundColor: task.projectColor }}
                                            />
                                            <span className="text-sm text-muted-foreground truncate max-w-[130px]">
                                                    {task.projectName}
                                                </span>
                                        </Link>
                                    </td>

                                    {/* Status */}
                                    <td className="px-4 py-4 hidden md:table-cell">
                                        <Badge
                                            variant="outline"
                                            className={`text-[11px] px-2 ${statusMeta.cls}`}
                                        >
                                            {statusMeta.label}
                                        </Badge>
                                    </td>

                                    {/* Priority */}
                                    <td className="px-4 py-4 hidden md:table-cell">
                                        <div className="flex items-center gap-1.5">
                                            <span className={`w-2 h-2 rounded-full ${priorityMeta.dot}`} />
                                            <span className={`text-sm ${priorityMeta.textCls}`}>
                                                    {priorityMeta.label}
                                                </span>
                                        </div>
                                    </td>

                                    {/* Due */}
                                    <td className="px-4 py-4 hidden lg:table-cell">
                                        {task.dueDate ? (
                                            <span
                                                className={`text-sm flex items-center gap-1 ${
                                                    isOverdueRow ? "text-red-400" : "text-muted-foreground"
                                                }`}
                                            >
                                                    {isOverdueRow && <AlertTriangle size={12} />}
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

            {/* ── Footer count ── */}
            {!loading && filtered.length > 0 && (
                <p className="text-sm text-muted-foreground text-center pt-1">
                    Showing {filtered.length} of {tasks.length} task{tasks.length !== 1 ? "s" : ""}
                </p>
            )}

            {/* ── Task detail modal ── */}
            <TaskDetailModal
                task={selectedTask ? { ...selectedTask, comments: selectedTask.comments ?? [] } : null}
                open={!!selectedTask}
                onClose={() => setSelectedTask(null)}
                onUpdate={async (id, updates) => {
                    await updateTask(id, updates);
                    setSelectedTask((prev) => (prev ? { ...prev, ...updates } : null));
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