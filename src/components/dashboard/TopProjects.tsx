import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { TopProject } from "../../../types/dashboard";

interface TopProjectsProps {
    projects: TopProject[];
}

const STATUS_META: Record<string, { label: string; cls: string }> = {
    active: { label: "Active", cls: "bg-emerald-500/10 text-emerald-500" },
    completed: { label: "Completed", cls: "bg-primary/10 text-primary" },
    archived: { label: "Archived", cls: "bg-muted text-muted-foreground" },
};

export default function TopProjects({ projects }: TopProjectsProps) {
    return (
        <div className="bg-primary-foreground rounded-xl border border-border/50 p-6 space-y-5">
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="text-base font-semibold text-foreground">Top Projects</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">Most active by task count</p>
                </div>
                <Link
                    href="/projects"
                    className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                >
                    All projects <ArrowUpRight size={13} />
                </Link>
            </div>

            <div className="space-y-2">
                {projects.map((p) => {
                    const pct = p.taskCount ? Math.round((p.tasksCompleted / p.taskCount) * 100) : 0;
                    const statusMeta = STATUS_META[p.status] ?? STATUS_META.active;
                    return (
                        <Link
                            key={p.id}
                            href={`/projects/${p.id}`}
                            className="block space-y-2 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0"
                                    style={{ background: p.color + "22" }}
                                >
                                    {p.icon}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                                            {p.name}
                                        </p>
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${statusMeta.cls}`}>
                                            {statusMeta.label}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between mt-0.5">
                                        <p className="text-xs text-muted-foreground">
                                            {p.tasksCompleted} / {p.taskCount} tasks
                                        </p>
                                        <p className="text-xs font-semibold" style={{ color: p.color }}>
                                            {pct}%
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Progress bar */}
                            <div className="h-1.5 bg-border/40 rounded-full overflow-hidden ml-12">
                                <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{ width: `${pct}%`, background: p.color }}
                                />
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}