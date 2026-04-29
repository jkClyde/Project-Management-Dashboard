import { TrendingUp, Target, Users, BarChart2 } from "lucide-react";

interface OverallProgressProps {
    pct: number;
    totalProjects: number;
    activeProjects: number;
    teamMembers: number;
    avgTasksPerProject: number;
}

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function OverallProgress({
                                            pct,
                                            totalProjects,
                                            activeProjects,
                                            teamMembers,
                                            avgTasksPerProject,
                                        }: OverallProgressProps) {
    const offset = CIRCUMFERENCE - (pct / 100) * CIRCUMFERENCE;

    return (
        <div className="bg-primary-foreground rounded-xl border border-border/50 p-6 h-full flex flex-col gap-5">
            <div>
                <h3 className="text-base font-semibold text-foreground">Overall Progress</h3>
                <p className="text-sm text-muted-foreground mt-0.5">Across all active projects and tasks</p>
            </div>

            <div className="flex items-center gap-6">
                {/* Bigger circular ring */}
                <div className="relative shrink-0">
                    <svg width="120" height="120" viewBox="0 0 120 120">
                        {/* Track */}
                        <circle
                            cx="60" cy="60" r={RADIUS}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="10"
                            className="text-border/50"
                        />
                        {/* Progress */}
                        <circle
                            cx="60" cy="60" r={RADIUS}
                            fill="none"
                            strokeWidth="10"
                            strokeDasharray={CIRCUMFERENCE}
                            strokeDashoffset={offset}
                            strokeLinecap="round"
                            className="text-primary transition-all duration-700"
                            stroke="currentColor"
                            transform="rotate(-90 60 60)"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold text-foreground">{pct}%</span>
                        <span className="text-xs text-muted-foreground">done</span>
                    </div>
                </div>

                {/* Stats alongside ring */}
                <div className="flex-1 grid grid-cols-2 gap-3">
                    <div className="bg-muted/50 rounded-lg p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                            <Target size={13} className="text-primary" />
                            <span className="text-xs text-muted-foreground">Projects</span>
                        </div>
                        <p className="text-xl font-bold text-foreground">{totalProjects}</p>
                        <p className="text-xs text-muted-foreground">{activeProjects} active</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                            <Users size={13} className="text-violet-500" />
                            <span className="text-xs text-muted-foreground">Team</span>
                        </div>
                        <p className="text-xl font-bold text-foreground">{teamMembers}</p>
                        <p className="text-xs text-muted-foreground">members</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                            <BarChart2 size={13} className="text-sky-500" />
                            <span className="text-xs text-muted-foreground">Avg tasks</span>
                        </div>
                        <p className="text-xl font-bold text-foreground">{avgTasksPerProject}</p>
                        <p className="text-xs text-muted-foreground">per project</p>
                    </div>
                    <div className="bg-primary/10 rounded-lg p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                            <TrendingUp size={13} className="text-primary" />
                            <span className="text-xs text-muted-foreground">Status</span>
                        </div>
                        <p className="text-sm font-semibold text-primary">On track</p>
                        <p className="text-xs text-muted-foreground">Keep going!</p>
                    </div>
                </div>
            </div>
        </div>
    );
}