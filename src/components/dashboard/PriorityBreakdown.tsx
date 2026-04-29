import { TaskPriority } from "../../../types/dashboard";

interface PriorityBreakdownProps {
    tasksByPriority: Record<TaskPriority, number>;
    total: number;
}

const ITEMS: {
    key: TaskPriority;
    label: string;
    barColor: string;
    bgColor: string;
    textColor: string;
    dot: string;
}[] = [
        { key: "urgent", label: "Urgent", barColor: "bg-red-500", bgColor: "bg-red-500/10", textColor: "text-red-500", dot: "bg-red-500" },
        { key: "high", label: "High", barColor: "bg-orange-500", bgColor: "bg-orange-500/10", textColor: "text-orange-500", dot: "bg-orange-500" },
        { key: "medium", label: "Medium", barColor: "bg-yellow-500", bgColor: "bg-yellow-500/10", textColor: "text-yellow-500", dot: "bg-yellow-500" },
        { key: "low", label: "Low", barColor: "bg-sky-500", bgColor: "bg-sky-500/10", textColor: "text-sky-500", dot: "bg-sky-500" },
    ];

export default function PriorityBreakdown({ tasksByPriority, total }: PriorityBreakdownProps) {
    const max = Math.max(...Object.values(tasksByPriority), 1);

    return (
        <div className="bg-primary-foreground rounded-xl border border-border/50 p-6 space-y-5">
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="text-base font-semibold text-foreground">Priority Breakdown</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">Distribution across all tasks</p>
                </div>
                <span className="text-xs font-medium bg-muted text-muted-foreground px-2.5 py-1 rounded-full">
                    {total} tasks
                </span>
            </div>

            <div className="space-y-4">
                {ITEMS.map(({ key, label, barColor, bgColor, textColor, dot }) => {
                    const count = tasksByPriority[key] ?? 0;
                    const pct = total ? Math.round((count / total) * 100) : 0;
                    const barPct = (count / max) * 100;
                    return (
                        <div key={key} className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className={`w-2.5 h-2.5 rounded-full ${dot}`} />
                                    <span className={`text-sm font-medium ${textColor}`}>{label}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${bgColor} ${textColor}`}>
                                        {pct}%
                                    </span>
                                    <span className="text-sm font-bold text-foreground w-6 text-right">{count}</span>
                                </div>
                            </div>
                            <div className="h-2.5 bg-border/40 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full ${barColor} transition-all duration-500`}
                                    style={{ width: `${barPct}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}