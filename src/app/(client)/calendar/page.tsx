"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import {
    ChevronLeft,
    ChevronRight,
    CalendarDays,
    LayoutList,
    AlertTriangle,
    Clock,
    CheckCircle2,
    CircleDot,
    FolderKanban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCalendar } from "@/hooks/useCalendar";
import CalendarDayPopover from "@/components/CalendarDayPopover";
import { CalendarTask } from "../../../../types/Calendar";
import { TaskStatus, TaskPriority } from "../../../../types/task";

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const STATUS_META: Record<TaskStatus, { label: string; cls: string; icon: React.ElementType }> = {
    todo:        { label: "To Do",       cls: "bg-slate-500/10 text-slate-400 border-slate-500/20",   icon: CircleDot },
    in_progress: { label: "In Progress", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20",  icon: Clock },
    done:        { label: "Done",        cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: CheckCircle2 },
};

const PRIORITY_DOT: Record<TaskPriority, string> = {
    low: "bg-sky-400", medium: "bg-yellow-400", high: "bg-orange-400", urgent: "bg-red-400",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isoDate(d: Date) {
    return d.toISOString().split("T")[0];
}

function sameDay(a: Date, b: Date) {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
}

function buildCalendarGrid(year: number, month: number): Date[] {
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = getDaysInMonth(year, month);
    const cells: Date[] = [];

    for (let i = firstDay - 1; i >= 0; i--) {
        cells.push(new Date(year, month, -i));
    }
    for (let d = 1; d <= totalDays; d++) {
        cells.push(new Date(year, month, d));
    }
    let next = 1;
    while (cells.length < 42) {
        cells.push(new Date(year, month + 1, next++));
    }
    return cells;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CalendarSkeleton() {
    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-44" />
                <div className="flex gap-2">
                    <Skeleton className="h-9 w-9 rounded-lg" />
                    <Skeleton className="h-9 w-9 rounded-lg" />
                </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-xl" />
                ))}
            </div>
            <div className="bg-primary-foreground rounded-xl border border-border/50 overflow-hidden">
                <div className="grid grid-cols-7 border-b border-border/50">
                    {DAYS.map((d) => (
                        <Skeleton key={d} className="h-10 rounded-none" />
                    ))}
                </div>
                <div className="grid grid-cols-7">
                    {Array.from({ length: 42 }).map((_, i) => (
                        <Skeleton key={i} className="h-28 rounded-none" />
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Task pill ────────────────────────────────────────────────────────────────

function TaskPill({ task }: { task: CalendarTask }) {
    const isOverdue = new Date(task.dueDate) < new Date() && task.status !== "done";
    return (
        <Link
            href={`/tasks/${task.id}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium truncate hover:opacity-80 transition-opacity"
            style={{
                backgroundColor: `${task.projectColor}22`,
                color: task.projectColor,
                border: `0.5px solid ${task.projectColor}44`,
            }}
            title={task.title}
        >
            {isOverdue && <AlertTriangle size={8} className="text-red-400 shrink-0" />}
            <span className="truncate">{task.title}</span>
        </Link>
    );
}

// ─── List view row ────────────────────────────────────────────────────────────

function ListRow({ task }: { task: CalendarTask }) {
    const statusMeta = STATUS_META[task.status];
    const isOverdue = new Date(task.dueDate) < new Date() && task.status !== "done";

    return (
        <Link
            href={`/tasks/${task.id}`}
            className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/20 transition-colors group"
        >
            <span
                className="w-2.5 h-2.5 rounded-sm shrink-0"
                style={{ backgroundColor: task.projectColor }}
            />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                    {task.title}
                </p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{task.projectName}</p>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
                <Badge variant="outline" className={`text-[11px] px-2 hidden sm:inline-flex ${statusMeta.cls}`}>
                    {statusMeta.label}
                </Badge>
                <span className={`w-2 h-2 rounded-full ${PRIORITY_DOT[task.priority]}`} />
                <span
                    className={`text-sm flex items-center gap-1 ${
                        isOverdue ? "text-red-400" : "text-muted-foreground"
                    }`}
                >
                    {isOverdue && <AlertTriangle size={12} />}
                    {new Date(task.dueDate).toLocaleDateString("en-US", {
                        month: "short", day: "numeric",
                    })}
                </span>
            </div>
        </Link>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CalendarPage() {
    const today = new Date();
    const [current, setCurrent] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
    const [view, setView] = useState<"month" | "list">("month");
    const [filterProject, setFilterProject] = useState<string>("all");
    const [popoverDay, setPopoverDay] = useState<Date | null>(null);
    const popoverRef = useRef<HTMLDivElement>(null);

    const { tasks, projects, loading, error } = useCalendar();

    const year = current.getFullYear();
    const month = current.getMonth();
    const monthLabel = current.toLocaleDateString("en-US", { month: "long", year: "numeric" });

    // ── Close popover on outside click ────────────────────────────────────────
    useEffect(() => {
        function handle(e: MouseEvent) {
            if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
                setPopoverDay(null);
            }
        }
        document.addEventListener("mousedown", handle);
        return () => document.removeEventListener("mousedown", handle);
    }, []);

    // ── Derived data ──────────────────────────────────────────────────────────
    const filteredTasks = useMemo(() => {
        if (filterProject === "all") return tasks;
        return tasks.filter((t) => t.projectId === filterProject);
    }, [tasks, filterProject]);

    const tasksByDate = useMemo(() => {
        const map = new Map<string, CalendarTask[]>();
        for (const task of filteredTasks) {
            const key = task.dueDate.split("T")[0];
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(task);
        }
        return map;
    }, [filteredTasks]);

    const grid = useMemo(() => buildCalendarGrid(year, month), [year, month]);

    const monthTasks = useMemo(
        () => filteredTasks.filter((t) => {
            const d = new Date(t.dueDate);
            return d.getFullYear() === year && d.getMonth() === month;
        }),
        [filteredTasks, year, month]
    );

    const listTasks = useMemo(
        () => [...monthTasks].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
        [monthTasks]
    );

    const monthOverdue = monthTasks.filter((t) => new Date(t.dueDate) < today && t.status !== "done").length;
    const monthDone    = monthTasks.filter((t) => t.status === "done").length;

    // ── Navigation ────────────────────────────────────────────────────────────
    const prevMonth = () => setCurrent(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrent(new Date(year, month + 1, 1));
    const goToday   = () => setCurrent(new Date(today.getFullYear(), today.getMonth(), 1));

    if (loading) return <CalendarSkeleton />;

    return (
        <div className="space-y-6">

            {/* ── Header ── */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
                        <CalendarDays size={24} className="text-primary" />
                        Calendar
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Tasks and projects due this month
                    </p>
                </div>
                <Tabs value={view} onValueChange={(v) => setView(v as "month" | "list")}>
                    <TabsList className="h-9">
                        <TabsTrigger value="month" className="text-sm px-4 gap-1.5">
                            <CalendarDays size={13} /> Month
                        </TabsTrigger>
                        <TabsTrigger value="list" className="text-sm px-4 gap-1.5">
                            <LayoutList size={13} /> List
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* ── Stat cards ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: "This Month", value: monthTasks.length, sub: `${monthDone} completed`,         accent: "text-foreground",  bg: "bg-muted",          icon: CalendarDays },
                    { label: "Completed",  value: monthDone,          sub: "Done this month",               accent: "text-emerald-400", bg: "bg-emerald-500/10", icon: CheckCircle2 },
                    { label: "Overdue",    value: monthOverdue,       sub: "Need attention",                accent: "text-red-400",     bg: "bg-red-500/10",     icon: AlertTriangle },
                    { label: "Projects",   value: projects.length,    sub: "Across all projects",           accent: "text-primary",     bg: "bg-primary/10",     icon: FolderKanban },
                ].map(({ label, value, sub, accent, bg, icon: Icon }) => (
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

            {/* ── Toolbar ── */}
            <div className="bg-primary-foreground rounded-xl border border-border/50 p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                {/* Month navigation */}
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-9 w-9" onClick={prevMonth}>
                        <ChevronLeft size={15} />
                    </Button>
                    <span className="text-sm font-semibold min-w-[148px] text-center">{monthLabel}</span>
                    <Button variant="outline" size="icon" className="h-9 w-9" onClick={nextMonth}>
                        <ChevronRight size={15} />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-9 text-sm px-4 ml-1"
                        onClick={goToday}
                    >
                        Today
                    </Button>
                </div>

                {/* Project filter pills */}
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={() => setFilterProject("all")}
                        className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                            filterProject === "all"
                                ? "bg-primary text-primary-foreground border-primary"
                                : "border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
                        }`}
                    >
                        All projects
                    </button>
                    {projects.map((p) => (
                        <button
                            key={p.id}
                            onClick={() => setFilterProject(filterProject === p.id ? "all" : p.id)}
                            className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                                filterProject === p.id
                                    ? "border-current"
                                    : "border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
                            }`}
                            style={
                                filterProject === p.id
                                    ? { color: p.color, borderColor: p.color, backgroundColor: `${p.color}15` }
                                    : {}
                            }
                        >
                            <span>{p.icon}</span>
                            <span className="max-w-[110px] truncate">{p.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Error ── */}
            {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl px-4 py-3">
                    {error}
                </div>
            )}

            {/* ══════════════ MONTH VIEW ══════════════ */}
            {view === "month" && (
                <div className="bg-primary-foreground rounded-xl border border-border/50 overflow-hidden">
                    {/* Day headers */}
                    <div className="grid grid-cols-7 border-b border-border/50">
                        {DAYS.map((d) => (
                            <div
                                key={d}
                                className="text-center text-xs font-semibold text-muted-foreground py-3 border-r border-border/30 last:border-r-0 uppercase tracking-wide"
                            >
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* Grid */}
                    <div className="grid grid-cols-7 auto-rows-fr">
                        {grid.map((day, idx) => {
                            const isCurrentMonth = day.getMonth() === month;
                            const isToday        = sameDay(day, today);
                            const key            = isoDate(day);
                            const dayTasks       = tasksByDate.get(key) ?? [];
                            const MAX_VISIBLE    = 3;
                            const visible        = dayTasks.slice(0, MAX_VISIBLE);
                            const overflow       = dayTasks.length - MAX_VISIBLE;
                            const isPopoverOpen  = popoverDay ? sameDay(popoverDay, day) : false;

                            return (
                                <div
                                    key={idx}
                                    onClick={() => {
                                        if (dayTasks.length > 0) {
                                            setPopoverDay(isPopoverOpen ? null : day);
                                        }
                                    }}
                                    className={`relative min-h-[100px] sm:min-h-[120px] p-2 border-b border-r border-border/30 last:border-r-0 transition-colors
                                        ${isCurrentMonth ? "bg-transparent" : "bg-muted/20"}
                                        ${dayTasks.length > 0 ? "cursor-pointer hover:bg-muted/20" : ""}
                                        ${isToday ? "ring-1 ring-inset ring-primary/50 bg-primary/[0.02]" : ""}
                                    `}
                                >
                                    {/* Date number */}
                                    <div className="flex justify-end mb-1.5">
                                        <span
                                            className={`text-xs w-7 h-7 flex items-center justify-center rounded-full font-medium transition-colors
                                                ${isToday ? "bg-primary text-primary-foreground font-semibold" : ""}
                                                ${!isCurrentMonth ? "text-muted-foreground/30" : "text-foreground"}
                                            `}
                                        >
                                            {day.getDate()}
                                        </span>
                                    </div>

                                    {/* Task pills */}
                                    <div className="space-y-0.5">
                                        {visible.map((task) => (
                                            <TaskPill key={task.id} task={task} />
                                        ))}
                                        {overflow > 0 && (
                                            <p className="text-[10px] text-muted-foreground px-1 mt-0.5">
                                                +{overflow} more
                                            </p>
                                        )}
                                    </div>

                                    {/* Day popover */}
                                    {isPopoverOpen && (
                                        <div ref={popoverRef}>
                                            <CalendarDayPopover
                                                date={day}
                                                tasks={dayTasks}
                                                onClose={() => setPopoverDay(null)}
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ══════════════ LIST VIEW ══════════════ */}
            {view === "list" && (
                <div className="bg-primary-foreground rounded-xl border border-border/50 overflow-hidden">
                    {listTasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <CalendarDays size={40} className="text-muted-foreground/30 mb-4" />
                            <p className="text-base font-semibold text-foreground mb-1">No tasks due this month</p>
                            <p className="text-sm text-muted-foreground">
                                Tasks with due dates in {monthLabel} will appear here
                            </p>
                        </div>
                    ) : (
                        (() => {
                            const grouped = new Map<string, CalendarTask[]>();
                            for (const t of listTasks) {
                                const key = t.dueDate.split("T")[0];
                                if (!grouped.has(key)) grouped.set(key, []);
                                grouped.get(key)!.push(t);
                            }
                            return Array.from(grouped.entries()).map(([dateKey, dayTasks]) => {
                                const d       = new Date(dateKey + "T00:00:00");
                                const isToday = sameDay(d, today);
                                const isPast  = d < today && !isToday;
                                return (
                                    <div key={dateKey}>
                                        {/* Date group header */}
                                        <div
                                            className={`px-5 py-2.5 border-b border-border/40 flex items-center gap-2.5
                                                ${isToday ? "bg-primary/5" : "bg-muted/20"}`}
                                        >
                                            <span
                                                className={`text-sm font-medium ${
                                                    isToday
                                                        ? "text-primary"
                                                        : isPast
                                                            ? "text-red-400"
                                                            : "text-foreground"
                                                }`}
                                            >
                                                {d.toLocaleDateString("en-US", {
                                                    weekday: "short",
                                                    month: "short",
                                                    day: "numeric",
                                                })}
                                            </span>
                                            {isToday && (
                                                <Badge className="text-[10px] h-5 px-2 bg-primary/10 text-primary border-primary/20">
                                                    Today
                                                </Badge>
                                            )}
                                            {isPast && (
                                                <AlertTriangle size={13} className="text-red-400" />
                                            )}
                                            <span className="text-xs text-muted-foreground ml-auto">
                                                {dayTasks.length} task{dayTasks.length !== 1 ? "s" : ""}
                                            </span>
                                        </div>
                                        <div className="divide-y divide-border/30">
                                            {dayTasks.map((task) => (
                                                <ListRow key={task.id} task={task} />
                                            ))}
                                        </div>
                                    </div>
                                );
                            });
                        })()
                    )}
                </div>
            )}

            {/* ── Legend ── */}
            <div className="flex items-center gap-4 flex-wrap justify-end pb-1">
                {projects.slice(0, 6).map((p) => (
                    <div key={p.id} className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: p.color }} />
                        <span className="text-xs text-muted-foreground truncate max-w-[90px]">{p.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}