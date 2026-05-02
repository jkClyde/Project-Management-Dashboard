// components/ProjectCard.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import {
    MoreVertical, Users, CheckSquare,
    Archive, Trash2, Settings, ArrowRight,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ProjectWithStats, ProjectStatus } from "../../types/projects";

interface ProjectCardProps {
    project: ProjectWithStats;
    onArchive: (id: string) => void;
    onDelete: (id: string) => void;
}

const statusConfig: Record<ProjectStatus, { label: string; className: string }> = {
    active:    { label: "Active",    className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
    completed: { label: "Completed", className: "bg-primary/10 text-primary border-primary/20" },
    archived:  { label: "Archived",  className: "bg-muted text-muted-foreground border-border" },
};

function getInitials(name: string | null): string {
    if (!name) return "?";
    return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function ProgressBar({ completed, total }: { completed: number; total: number }) {
    const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{completed}/{total} tasks</span>
                <span className="text-xs font-medium text-muted-foreground">{pct}%</span>
            </div>
            <Progress value={pct} className="h-1.5" />
        </div>
    );
}

export default function ProjectCard({ project, onArchive, onDelete }: ProjectCardProps) {
    const status = statusConfig[project.status];

    return (
        <div className="group relative bg-card rounded-xl border border-border/50 overflow-hidden hover:border-border hover:shadow-sm transition-all duration-150 flex flex-col">

            {/* Color accent bar */}
            <div className="h-1 w-full shrink-0" style={{ backgroundColor: project.color }} />

            <div className="p-4 flex flex-col flex-1 gap-3">

                {/* ── Header row ── */}
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0"
                            style={{
                                backgroundColor: project.color + "1a",
                                border: `1px solid ${project.color}33`,
                            }}
                        >
                            {project.icon}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground line-clamp-1">
                                {project.name}
                            </p>
                            {project.description && (
                                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                    {project.description}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Context menu — stops the card link click */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                onClick={(e) => e.preventDefault()}
                                className="p-1 rounded-md text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground hover:bg-muted transition-all shrink-0 z-10 relative"
                            >
                                <MoreVertical size={15} />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem asChild>
                                <Link href={`/projects/${project.id}/settings`} className="flex items-center gap-2">
                                    <Settings size={13} />
                                    Settings
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="flex items-center gap-2"
                                onClick={() => onArchive(project.id)}
                            >
                                <Archive size={13} />
                                Archive
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="flex items-center gap-2 text-destructive focus:text-destructive"
                                onClick={() => {
                                    if (confirm(`Delete "${project.name}"? This cannot be undone.`)) {
                                        onDelete(project.id);
                                    }
                                }}
                            >
                                <Trash2 size={13} />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Status badge */}
                <div>
                    <Badge variant="outline" className={`text-[11px] px-2 py-0.5 ${status.className}`}>
                        {status.label}
                    </Badge>
                </div>

                {/* Progress */}
                <div className="flex-1">
                    {project.taskCount > 0 ? (
                        <ProgressBar completed={project.tasksCompleted} total={project.taskCount} />
                    ) : (
                        <p className="text-xs text-muted-foreground italic">No tasks yet</p>
                    )}
                </div>

                {/* ── Footer ── */}
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    {/* Member avatars */}
                    <div className="flex items-center gap-1.5">
                        <div className="flex -space-x-1.5">
                            <Avatar className="w-6 h-6 border-2 border-card">
                                <AvatarImage src={project.ownerAvatar ?? undefined} />
                                <AvatarFallback className="text-[9px] bg-primary/20 text-primary">
                                    {getInitials(project.ownerName)}
                                </AvatarFallback>
                            </Avatar>
                            {project.memberCount > 1 && (
                                <div className="w-6 h-6 rounded-full bg-muted border-2 border-card flex items-center justify-center">
                                    <span className="text-[9px] text-muted-foreground font-medium">
                                        +{project.memberCount - 1}
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                            <Users size={11} />
                            <span className="text-xs">{project.memberCount}</span>
                        </div>
                    </div>

                    {/* Task count + open link */}
                    <div className="flex items-center gap-2.5 text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <CheckSquare size={11} />
                            <span className="text-xs">{project.taskCount}</span>
                        </div>
                        <span className="text-xs">
                            {new Date(project.updatedAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                            })}
                        </span>
                    </div>
                </div>
            </div>

            {/* Full-card link — sits behind everything, arrow hint on hover */}
            <Link
                href={`/projects/${project.id}`}
                className="absolute inset-0 z-0 rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                aria-label={`Open ${project.name}`}
            />

            {/* "Open" arrow pill — appears on hover, bottom-right */}
            <div className="absolute bottom-3.5 right-3.5 z-10 pointer-events-none opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all duration-150">
                <span className="flex items-center gap-1 text-[10px] font-medium bg-background/90 text-muted-foreground border border-border/60 rounded-md px-1.5 py-0.5 shadow-sm backdrop-blur-sm">
                    Open
                    <ArrowRight size={9} />
                </span>
            </div>
        </div>
    );
}