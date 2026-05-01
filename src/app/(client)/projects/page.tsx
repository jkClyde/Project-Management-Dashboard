"use client";

import { useState, useMemo } from "react";
import {
    Plus, LayoutGrid, List, Search, SlidersHorizontal,
    FolderKanban, CheckCircle2, TrendingUp, Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

import { useProjects } from "@/hooks/useProject";
import ProjectCard from "@/components/ProjectCard";
import CreateProjectModal from "@/components/CreateProjectModal";
import { ProjectStatus } from "../../../../types/projects";

type FilterTab = "all" | ProjectStatus;

const SORT_OPTIONS = [
    { value: "updated",  label: "Last updated" },
    { value: "name",     label: "Name A–Z" },
    { value: "tasks",    label: "Most tasks" },
    { value: "progress", label: "Progress" },
];

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
                      label,
                      value,
                      sub,
                      accent = "text-foreground",
                      icon: Icon,
                      iconBg = "bg-muted",
                  }: {
    label: string;
    value: string | number;
    sub?: string;
    accent?: string;
    icon: React.ElementType;
    iconBg?: string;
}) {
    return (
        <div className="bg-primary-foreground rounded-xl border border-border/50 p-5 flex items-start gap-4">
            <div className={`${iconBg} rounded-xl p-3 shrink-0`}>
                <Icon size={22} className={accent} />
            </div>
            <div className="min-w-0">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className={`text-3xl font-bold leading-tight mt-0.5 ${accent}`}>{value}</p>
                {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
            </div>
        </div>
    );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ProjectCardSkeleton() {
    return (
        <div className="bg-primary-foreground rounded-xl border border-border/50 overflow-hidden">
            <Skeleton className="h-1.5 w-full rounded-none" />
            <div className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                    <Skeleton className="w-11 h-11 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                    </div>
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
                <div className="space-y-2">
                    <div className="flex justify-between">
                        <Skeleton className="h-3.5 w-20" />
                        <Skeleton className="h-3.5 w-10" />
                    </div>
                    <Skeleton className="h-2 w-full rounded-full" />
                </div>
                <div className="flex justify-between pt-3 border-t border-border/50">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                </div>
            </div>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProjectsPage() {
    const [tab, setTab] = useState<FilterTab>("all");
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState("updated");
    const [view, setView] = useState<"grid" | "list">("grid");
    const [modalOpen, setModal] = useState(false);

    const { projects, loading, error, createProject, archiveProject, deleteProject } =
        useProjects({ status: tab === "all" ? "all" : tab });

    const filtered = useMemo(() => {
        let list = [...projects];

        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(
                (p) =>
                    p.name.toLowerCase().includes(q) ||
                    p.description?.toLowerCase().includes(q)
            );
        }

        list.sort((a, b) => {
            switch (sort) {
                case "name":
                    return a.name.localeCompare(b.name);
                case "tasks":
                    return b.taskCount - a.taskCount;
                case "progress": {
                    const pA = a.taskCount ? a.tasksCompleted / a.taskCount : 0;
                    const pB = b.taskCount ? b.tasksCompleted / b.taskCount : 0;
                    return pB - pA;
                }
                default: {
                    const uA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
                    const uB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
                    return uB - uA;
                }
            }
        });

        return list;
    }, [projects, search, sort]);

    const totalActive    = projects.filter((p) => p.status === "active").length;
    const totalCompleted = projects.filter((p) => p.status === "completed").length;
    const totalTasks     = projects.reduce((s, p) => s + p.taskCount, 0);
    const totalDone      = projects.reduce((s, p) => s + p.tasksCompleted, 0);
    const overallPct     = totalTasks === 0 ? 0 : Math.round((totalDone / totalTasks) * 100);

    return (
        <div className="space-y-6">

            {/* ── Header ── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Projects</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Manage and track all your projects
                    </p>
                </div>
                <Button onClick={() => setModal(true)} size="sm" className="gap-1.5 h-9 px-4 text-sm">
                    <Plus size={16} />
                    New project
                </Button>
            </div>

            {/* ── Stat cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Total Projects"
                    value={projects.length}
                    sub={`${totalActive} active · ${totalCompleted} completed`}
                    icon={FolderKanban}
                    accent="text-primary"
                    iconBg="bg-primary/10"
                />
                <StatCard
                    label="Active"
                    value={totalActive}
                    sub="Currently in progress"
                    icon={Layers}
                    accent="text-emerald-500"
                    iconBg="bg-emerald-500/10"
                />
                <StatCard
                    label="Completed"
                    value={totalCompleted}
                    sub="All tasks done"
                    icon={CheckCircle2}
                    accent="text-sky-500"
                    iconBg="bg-sky-500/10"
                />
                <StatCard
                    label="Overall Progress"
                    value={`${overallPct}%`}
                    sub={`${totalDone} of ${totalTasks} tasks done`}
                    icon={TrendingUp}
                    accent="text-violet-500"
                    iconBg="bg-violet-500/10"
                />
            </div>

            {/* ── Filters bar ── */}
            <div className="bg-primary-foreground rounded-xl border border-border/50 p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <Tabs value={tab} onValueChange={(v) => setTab(v as FilterTab)}>
                    <TabsList className="h-9">
                        <TabsTrigger value="all"       className="text-sm px-4">All</TabsTrigger>
                        <TabsTrigger value="active"    className="text-sm px-4">Active</TabsTrigger>
                        <TabsTrigger value="completed" className="text-sm px-4">Completed</TabsTrigger>
                        <TabsTrigger value="archived"  className="text-sm px-4">Archived</TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-56">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search projects…"
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

                    <div className="flex border border-border rounded-lg overflow-hidden">
                        <button
                            onClick={() => setView("grid")}
                            className={`p-2 transition-colors ${
                                view === "grid"
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            }`}
                            aria-label="Grid view"
                        >
                            <LayoutGrid size={15} />
                        </button>
                        <button
                            onClick={() => setView("list")}
                            className={`p-2 transition-colors ${
                                view === "list"
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            }`}
                            aria-label="List view"
                        >
                            <List size={15} />
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Error ── */}
            {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl px-4 py-3">
                    {error}
                </div>
            )}

            {/* ── Content ── */}
            {loading ? (
                <div className={
                    view === "grid"
                        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4"
                        : "grid grid-cols-1 gap-3"
                }>
                    {Array.from({ length: 6 }).map((_, i) => (
                        <ProjectCardSkeleton key={i} />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-primary-foreground rounded-xl border border-border/50 flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4 opacity-60">
                        <FolderKanban size={30} className="text-muted-foreground" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground mb-1.5">
                        {search ? "No projects match your search" : "No projects yet"}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6 max-w-xs">
                        {search
                            ? "Try a different search term or clear the filter"
                            : "Create your first project to start tracking tasks and progress"}
                    </p>
                    {!search && (
                        <Button onClick={() => setModal(true)} size="sm" className="gap-1.5">
                            <Plus size={15} />
                            New project
                        </Button>
                    )}
                </div>
            ) : (
                <>
                    <div className={
                        view === "grid"
                            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4"
                            : "grid grid-cols-1 gap-3"
                    }>
                        {filtered.map((project) => (
                            <ProjectCard
                                key={project.id}
                                project={project}
                                onArchive={archiveProject}
                                onDelete={deleteProject}
                            />
                        ))}
                    </div>

                    <p className="text-sm text-muted-foreground text-center pt-1">
                        Showing {filtered.length} of {projects.length} project
                        {projects.length !== 1 ? "s" : ""}
                    </p>
                </>
            )}

            <CreateProjectModal
                open={modalOpen}
                onClose={() => setModal(false)}
                onSubmit={createProject}
            />
        </div>
    );
}