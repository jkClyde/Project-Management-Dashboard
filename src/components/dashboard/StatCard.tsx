import Link from "next/link";

interface StatCardProps {
    icon: React.ElementType;
    label: string;
    value: string | number;
    sub?: string;
    accent?: string;
    iconBg?: string;
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
                                     trend,
                                     href,
                                 }: StatCardProps) {
    const inner = (
        <>
            <div className="flex items-start justify-between">
                <div className={`${iconBg} rounded-xl p-3 shrink-0`}>
                    <Icon size={22} className={accent} />
                </div>
                {trend && (
                    <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                            trend.positive
                                ? "bg-emerald-500/10 text-emerald-500"
                                : "bg-red-500/10 text-red-400"
                        }`}
                    >
            {trend.positive ? "↑" : "↓"} {trend.value}
          </span>
                )}
            </div>
            <div>
                <p className="text-sm text-muted-foreground mb-1">{label}</p>
                <p className={`text-4xl font-bold leading-none tracking-tight ${accent}`}>
                    {value}
                </p>
                {sub && <p className="text-sm text-muted-foreground mt-2">{sub}</p>}
            </div>
        </>
    );

    const cls =
        "bg-primary-foreground rounded-xl border border-border/50 p-5 flex flex-col gap-4" +
        (href ? " hover:border-primary/40 hover:shadow-sm transition-all" : "");

    if (href) {
        return (
            <Link href={href} className={cls}>
                {inner}
            </Link>
        );
    }

    return <div className={cls}>{inner}</div>;
}