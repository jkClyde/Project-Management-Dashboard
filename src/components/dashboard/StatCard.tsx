import Link from "next/link";

interface StatCardProps {
    icon: React.ElementType;
    label: string;
    value: string | number;
    sub?: string;
    accent?: string;
    iconBg?: string;
    iconColor?: string;
    stripeColor?: string;
    trend?: { value: string; positive: boolean };
    href?: string;
}

export default function StatCard({
    icon: Icon,
    label,
    value,
    sub,
    accent = "text-foreground",
    iconBg = "bg-muted",
    iconColor,
    stripeColor,
    trend,
    href,
}: StatCardProps) {
    const inner = (
        <>
            {/* Top accent stripe */}
            {stripeColor && (
                <div
                    className="absolute top-0 left-0 right-0 h-[3px] rounded-t-xl"
                    style={{ background: stripeColor }}
                />
            )}

            {/* Icon + Trend row */}
            <div className="flex items-start justify-between">
                <div className={`${iconBg} rounded-xl p-2.5 shrink-0`}>
                    <Icon size={18} className={iconColor ?? accent} />
                </div>
                {trend && (
                    <span
                        className={`text-[11px] font-medium px-2 py-1 rounded-full flex items-center gap-1 ${
                            trend.positive
                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                : "bg-red-500/10 text-red-700 dark:text-red-400"
                        }`}
                    >
                        {trend.positive ? "↑" : "↓"} {trend.value}
                    </span>
                )}
            </div>

            {/* Value block */}
            <div className="flex flex-col gap-0.5">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className={`text-[32px] font-medium leading-none tracking-tight ${accent}`}>
                    {value}
                </p>
                {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
            </div>

            {/* Divider */}
            <div className="-mx-5 h-px bg-border/50" />

            {/* Footer */}
            <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground/60">
                    {href ? "View all →" : ""}
                </span>
                {stripeColor && (
                    <div className="flex items-center gap-1">
                        <div className="h-1 w-7 rounded-full opacity-90" style={{ background: stripeColor }} />
                        <div className="h-1 w-4 rounded-full opacity-50" style={{ background: stripeColor }} />
                        <div className="h-1 w-2 rounded-full opacity-30" style={{ background: stripeColor }} />
                    </div>
                )}
            </div>
        </>
    );

    const cls =
        "relative bg-card rounded-xl border border-border/50 p-5 flex flex-col gap-3.5 overflow-hidden" +
        (href ? " hover:border-border hover:shadow-sm transition-all cursor-pointer" : "");

    if (href) {
        return <Link href={href} className={cls}>{inner}</Link>;
    }

    return <div className={cls}>{inner}</div>;
}