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

function startOfMonth(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), 1);
}

function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
}

/** Build the 6-week grid (42 cells) for a given month */
function buildCalendarGrid(year: number, month: number): Date[] {
    const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
    const totalDays = getDaysInMonth(year, month);
    const cells: Date[] = [];

    // Pad with previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
        cells.push(new Date(year, month, -i));
    }
    // Current month
    for (let d = 1; d <= totalDays; d++) {
        cells.push(new Date(year, month, d));
    }
    // Pad with next month days to reach 42
    let next = 1;
    while (cells.length < 42) {
        cells.push(new Date(year, month + 1, next++));
    }
    return cells;
}

function getInitials(name?: string | null) {
    if (!name) return "?";
    return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CalendarSkeleton() {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Skeleton className="h-7 w-40" />
                <div className="flex gap-2">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
            </div>
            <div className="grid grid-cols-7 gap-px bg-border/30 rounded-xl overflow-hidden">
                {Array.from({ length: 42 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-none" />
                ))}
            </div>
        </div>
    );
}

// ─── Task pill (inside calendar cell) ────────────────────────────────────────

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
            className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors group"
        >
            <span
                className="w-2.5 h-2.5 rounded-sm shrink-0"
                style={{ backgroundColor: task.projectColor }}
            />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                    {task.title}
                </p>
                <p className="text-xs text-muted-foreground truncate">{task.projectName}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline" className={`text-[10px] px-1.5 hidden sm:inline-flex ${statusMeta.cls}`}>
                    {statusMeta.label}
                </Badge>
                <span className={`w-2 h-2 rounded-full ${PRIORITY_DOT[task.priority]}`} />
                <span
                    className={`text-xs flex items-center gap-1 ${
                        isOverdue ? "text-red-400" : "text-muted-foreground"
                    }`}
                >
                    {isOverdue && <AlertTriangle size={10} />}
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

    // ── Filtered tasks ────────────────────────────────────────────────────────
    const filteredTasks = useMemo(() => {
        if (filterProject === "all") return tasks;
        return tasks.filter((t) => t.projectId === filterProject);
    }, [tasks, filterProject]);

    // ── Tasks keyed by ISO date ───────────────────────────────────────────────
    const tasksByDate = useMemo(() => {
        const map = new Map<string, CalendarTask[]>();
        for (const task of filteredTasks) {
            const key = task.dueDate.split("T")[0];
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(task);
        }
        return map;
    }, [filteredTasks]);

    // ── Grid cells ────────────────────────────────────────────────────────────
    const grid = useMemo(() => buildCalendarGrid(year, month), [year, month]);

    // ── List view: tasks in current month sorted by date ─────────────────────
    const listTasks = useMemo(() => {
        return filteredTasks
            .filter((t) => {
                const d = new Date(t.dueDate);
                return d.getFullYear() === year && d.getMonth() === month;
            })
            .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    }, [filteredTasks, year, month]);

    // ── Stats for current month ───────────────────────────────────────────────
    const monthTasks = useMemo(
        () =>
            filteredTasks.filter((t) => {
                const d = new Date(t.dueDate);
                return d.getFullYear() === year && d.getMonth() === month;
            }),
        [filteredTasks, year, month]
    );
    const monthOverdue = monthTasks.filter(
        (t) => new Date(t.dueDate) < today && t.status !== "done"
    ).length;
    const monthDone = monthTasks.filter((t) => t.status === "done").length;

    // ── Navigation ────────────────────────────────────────────────────────────
    const prevMonth = () => setCurrent(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrent(new Date(year, month + 1, 1));
    const goToday   = () => setCurrent(new Date(today.getFullYear(), today.getMonth(), 1));

    if (loading) return <CalendarSkeleton />;

    return (
        <div className="space-y-5">

            {/* ── Header ── */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
                        <CalendarDays size={22} className="text-primary" />
                        Calendar
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Tasks and projects due this month
                    </p>
                </div>

                {/* View toggle */}
                <Tabs value={view} onValueChange={(v) => setView(v as "month" | "list")}>
                    <TabsList className="h-8">
                        <TabsTrigger value="month" className="text-xs px-3 gap-1.5">
                            <CalendarDays size={12} /> Month
                        </TabsTrigger>
                        <TabsTrigger value="list" className="text-xs px-3 gap-1.5">
                            <LayoutList size={12} /> List
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* ── Stat cards ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: "This month",  value: monthTasks.length,  accent: "text-foreground",   bg: "bg-muted",           icon: CalendarDays },
                    { label: "Completed",   value: monthDone,           accent: "text-emerald-400",  bg: "bg-emerald-500/10",  icon: CheckCircle2 },
                    { label: "Overdue",     value: monthOverdue,        accent: "text-red-400",      bg: "bg-red-500/10",      icon: AlertTriangle },
                    { label: "Projects",    value: projects.length,     accent: "text-primary",      bg: "bg-primary/10",      icon: FolderKanban },
                ].map(({ label, value, accent, bg, icon: Icon }) => (
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

            {/* ── Toolbar ── */}
            <div className="bg-primary-foreground rounded-xl border border-border/50 p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                {/* Month navigation */}
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={prevMonth}>
                        <ChevronLeft size={14} />
                    </Button>
                    <span className="text-sm font-medium min-w-[140px] text-center">{monthLabel}</span>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={nextMonth}>
                        <ChevronRight size={14} />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs ml-1"
                        onClick={goToday}
                    >
                        Today
                    </Button>
                </div>

                {/* Project filter */}
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={() => setFilterProject("all")}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
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
                            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                                filterProject === p.id
                                    ? "border-current"
                                    : "border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
                            }`}
                            style={filterProject === p.id ? { color: p.color, borderColor: p.color, backgroundColor: `${p.color}15` } : {}}
                        >
                            <span>{p.icon}</span>
                            <span className="max-w-[100px] truncate">{p.name}</span>
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

            {/* ══════════════════ MONTH VIEW ══════════════════ */}
            {view === "month" && (
                <div className="bg-primary-foreground rounded-xl border border-border/50 overflow-hidden">
                    {/* Day headers */}
                    <div className="grid grid-cols-7 border-b border-border/50">
                        {DAYS.map((d) => (
                            <div
                                key={d}
                                className="text-center text-xs font-medium text-muted-foreground py-2.5 border-r border-border/30 last:border-r-0"
                            >
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* Grid */}
                    <div className="grid grid-cols-7 auto-rows-fr">
                        {grid.map((day, idx) => {
                            const isCurrentMonth = day.getMonth() === month;
                            const isToday = sameDay(day, today);
                            const key = isoDate(day);
                            const dayTasks = tasksByDate.get(key) ?? [];
                            const MAX_VISIBLE = 3;
                            const visible = dayTasks.slice(0, MAX_VISIBLE);
                            const overflow = dayTasks.length - MAX_VISIBLE;
                            const isPopoverOpen = popoverDay ? sameDay(popoverDay, day) : false;

                            return (
                                <div
                                    key={idx}
                                    onClick={() => {
                                        if (dayTasks.length > 0) {
                                            setPopoverDay(isPopoverOpen ? null : day);
                                        }
                                    }}
                                    className={`relative min-h-[90px] sm:min-h-[110px] p-1.5 border-b border-r border-border/30 last:border-r-0 transition-colors
                                        ${isCurrentMonth ? "bg-transparent" : "bg-muted/20"}
                                        ${dayTasks.length > 0 ? "cursor-pointer hover:bg-muted/20" : ""}
                                        ${isToday ? "ring-1 ring-inset ring-primary/40" : ""}
                                    `}
                                >
                                    {/* Date number */}
                                    <div className="flex justify-end mb-1">
                                        <span
                                            className={`text-xs w-6 h-6 flex items-center justify-center rounded-full font-medium
                                                ${isToday ? "bg-primary text-primary-foreground" : ""}
                                                ${!isCurrentMonth ? "text-muted-foreground/40" : "text-foreground"}
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
                                            <p className="text-[10px] text-muted-foreground px-1">
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

            {/* ══════════════════ LIST VIEW ══════════════════ */}
            {view === "list" && (
                <div className="bg-primary-foreground rounded-xl border border-border/50 overflow-hidden">
                    {listTasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <CalendarDays size={32} className="text-muted-foreground/30 mb-3" />
                            <p className="text-sm font-medium text-foreground mb-1">No tasks due this month</p>
                            <p className="text-xs text-muted-foreground">
                                Tasks with due dates in {monthLabel} will appear here
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Group by date */}
                            {(() => {
                                const grouped = new Map<string, CalendarTask[]>();
                                for (const t of listTasks) {
                                    const key = t.dueDate.split("T")[0];
                                    if (!grouped.has(key)) grouped.set(key, []);
                                    grouped.get(key)!.push(t);
                                }
                                return Array.from(grouped.entries()).map(([dateKey, dayTasks]) => {
                                    const d = new Date(dateKey + "T00:00:00");
                                    const isToday = sameDay(d, today);
                                    const isPast = d < today && !isToday;
                                    return (
                                        <div key={dateKey}>
                                            {/* Date header */}
                                            <div className={`px-4 py-2 border-b border-border/40 flex items-center gap-2
                                                ${isToday ? "bg-primary/5" : "bg-muted/20"}`}
                                            >
                                                <span
                                                    className={`text-xs font-medium ${
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
                                                    <Badge className="text-[9px] h-4 px-1.5 bg-primary/10 text-primary border-primary/20">
                                                        Today
                                                    </Badge>
                                                )}
                                                {isPast && (
                                                    <AlertTriangle size={11} className="text-red-400" />
                                                )}
                                                <span className="text-[11px] text-muted-foreground ml-auto">
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
                            })()}
                        </>
                    )}
                </div>
            )}

            {/* ── Legend ── */}
            <div className="flex items-center gap-4 flex-wrap justify-end pb-1">
                {projects.slice(0, 6).map((p) => (
                    <div key={p.id} className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: p.color }} />
                        <span className="text-[11px] text-muted-foreground truncate max-w-[80px]">{p.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}