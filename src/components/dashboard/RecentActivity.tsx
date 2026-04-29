import { CheckCircle2, FolderKanban, CircleDot, Users, PenLine } from "lucide-react";
import Link from "next/link";
import { ActivityItem, ActivityType } from "../../types/dashboard";

interface RecentActivityProps {
    items: ActivityItem[];
}

const ACTIVITY_ICONS: Record<ActivityType, React.ElementType> = {
    task_done:       CheckCircle2,
    project_created: FolderKanban,
    task_created:    CircleDot,
    member_joined:   Users,
    task_updated:    PenLine,
};

const ACTIVITY_COLORS: Record<ActivityType, string> = {
    task_done:       "text-emerald-500 bg-emerald-500/10",
    project_created: "text-primary bg-primary/10",
    task_created:    "text-sky-500 bg-sky-500/10",
    member_joined:   "text-violet-500 bg-violet-500/10",
    task_updated:    "text-orange-500 bg-orange-500/10",
};

export default function RecentActivity({ items }: RecentActivityProps) {
    return (
        <div className="bg-primary-foreground rounded-xl border border-border/50 p-6 space-y-5">
            <div>
                <h3 className="text-base font-semibold text-foreground">Recent Activity</h3>
                <p className="text-sm text-muted-foreground mt-0.5">Latest updates across your projects</p>
            </div>

            {items.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">No recent activity</p>
            ) : (
                <div className="relative">
                    {/* Vertical timeline line */}
                    <div className="absolute left-5 top-0 bottom-0 w-px bg-border/60" />

                    <div className="space-y-1">
                        {items.map((item) => {
                            const Icon = ACTIVITY_ICONS[item.type];
                            const colorCls = ACTIVITY_COLORS[item.type];
                            return (
                                <Link
                                    key={item.id}
                                    href={item.href}
                                    className="flex items-start gap-4 py-3 relative rounded-lg hover:bg-muted/40 px-1 transition-colors group"
                                >
                                    {/* Icon on the timeline */}
                                    <div className={`p-2 rounded-lg shrink-0 z-10 ${colorCls}`}>
                                        <Icon size={14} />
                                    </div>

                                    <div className="flex-1 min-w-0 pt-0.5">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <p className="text-sm font-medium text-foreground leading-snug group-hover:text-primary transition-colors">
                                                    {item.label}
                                                </p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-xs text-muted-foreground">{item.sub}</span>
                                                    {item.user && (
                                                        <>
                                                            <span className="text-muted-foreground/40 text-xs">·</span>
                                                            <span className="text-xs text-muted-foreground">{item.user}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0 mt-0.5">
                        {item.time}
                      </span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}