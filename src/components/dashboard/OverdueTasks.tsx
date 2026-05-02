import { AlertTriangle, ArrowUpRight, Clock, User } from "lucide-react";
import Link from "next/link";
import { OverdueTask, TaskPriority } from "../../../types/dashboard";

interface OverdueTasksProps {
    tasks: OverdueTask[];
}

const PRIORITY_META: Record<TaskPriority, { label: string; cls: string }> = {
    urgent: { label: "Urgent", cls: "bg-red-500/10 text-red-500 border-red-500/20" },
    high:   { label: "High",   cls: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
    medium: { label: "Medium", cls: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" },
    low:    { label: "Low",    cls: "bg-sky-500/10 text-sky-500 border-sky-500/20" },
};

export default function OverdueTasks({ tasks }: OverdueTasksProps) {
    return (
        <div className="bg-primary-foreground rounded-xl border border-border/50 p-6 space-y-5">
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                        <AlertTriangle size={16} className="text-orange-500" />
                        Overdue Tasks
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        {tasks.length === 0
                            ? "All tasks are on track"
                            : `${tasks.length} task${tasks.length !== 1 ? "s" : ""} past due date`}
                    </p>
                </div>
                <Link
                    href="/projects"
                    className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                >
                    View all <ArrowUpRight size={13} />
                </Link>
            </div>

            {tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                    <span className="text-3xl mb-2">🎉</span>
                    <p className="text-sm font-medium text-foreground">You're all caught up!</p>
                    <p className="text-xs text-muted-foreground mt-1">No overdue tasks right now</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {tasks.map((t) => {
                        const meta = PRIORITY_META[t.priority];
                        return (
                            <Link
                                key={t.id}
                                href={`/projects/${t.projectId}`}
                                className="flex items-center gap-4 p-3 rounded-lg border border-border/50 bg-muted/30 hover:bg-muted/60 hover:border-primary/30 transition-colors group"
                            >
                                <div
                                    className="w-3 h-3 rounded-full shrink-0"
                                    style={{ background: t.projectColor }}
                                />

                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                                        {t.title}
                                    </p>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-xs text-muted-foreground">{t.projectName}</span>
                                        <span className="flex items-center gap-1 text-xs text-orange-500">
                      <Clock size={10} />
                                            {t.daysOverdue}d overdue
                    </span>
                                        {t.assignee && (
                                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <User size={10} />
                                                {t.assignee}
                      </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${meta.cls}`}>
                    {meta.label}
                  </span>
                                    <span className="text-xs text-muted-foreground">
                    Due{" "}
                                        {new Date(t.dueDate).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                        })}
                  </span>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}