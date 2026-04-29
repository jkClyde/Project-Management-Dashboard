import { TaskStatus } from "../../../types/dashboard";

interface TaskStatusBarProps {
    tasksByStatus: Record<TaskStatus, number>;
    total: number;
    completionRate: number;
}

const SEGMENTS: { key: TaskStatus; label: string; color: string; bg: string }[] = [
    { key: "done", label: "Done", color: "bg-emerald-500", bg: "bg-emerald-500/10" },
    { key: "in_progress", label: "In Progress", color: "bg-primary", bg: "bg-primary/10" },
    { key: "todo", label: "To Do", color: "bg-border", bg: "bg-muted" },
];

export default function TaskStatusBar({ tasksByStatus, total, completionRate }: TaskStatusBarProps) {
    return (
        <div className="bg-primary-foreground rounded-xl border border-border/50 p-6 space-y-5">
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="text-base font-semibold text-foreground">Task Status</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">{total} tasks total</p>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-bold text-emerald-500">{completionRate}%</p>
                    <p className="text-xs text-muted-foreground">completed this week</p>
                </div>
            </div>

            {/* Stacked bar */}
            <div className="flex h-4 rounded-full overflow-hidden gap-0.5">
                {SEGMENTS.map(({ key, color }) => {
                    const pct = total ? (tasksByStatus[key] / total) * 100 : 0;
                    return (
                        <div
                            key={key}
                            className={`${color} transition-all first:rounded-l-full last:rounded-r-full`}
                            style={{ width: `${pct}%` }}
                        />
                    );
                })}
            </div>

            {/* Legend cards */}
            <div className="grid grid-cols-3 gap-3">
                {SEGMENTS.map(({ key, label, color, bg }) => {
                    const count = tasksByStatus[key];
                    const pct = total ? Math.round((count / total) * 100) : 0;
                    return (
                        <div key={key} className={`${bg} rounded-lg p-3 space-y-1`}>
                            <div className="flex items-center gap-1.5">
                                <span className={`w-2.5 h-2.5 rounded-full ${color} shrink-0`} />
                                <span className="text-xs text-muted-foreground font-medium">{label}</span>
                            </div>
                            <p className="text-2xl font-bold text-foreground">{count}</p>
                            <p className="text-xs text-muted-foreground">{pct}% of total</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}