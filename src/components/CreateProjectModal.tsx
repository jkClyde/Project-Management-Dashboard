// components/CreateProjectModal.tsx
"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CreateProjectInput } from "../../types/projects";

const PRESET_COLORS = [
    "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
    "#f97316", "#eab308", "#22c55e", "#14b8a6",
    "#3b82f6", "#06b6d4",
];

const PRESET_ICONS = ["📁", "🚀", "💡", "🎯", "🛠", "📊", "🌐", "🎨", "📱", "⚡"];

interface CreateProjectModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (input: CreateProjectInput) => Promise<void>;
}

export default function CreateProjectModal({
    open,
    onClose,
    onSubmit,
}: CreateProjectModalProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [color, setColor] = useState(PRESET_COLORS[0]);
    const [icon, setIcon] = useState(PRESET_ICONS[0]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleClose = () => {
        setName("");
        setDescription("");
        setColor(PRESET_COLORS[0]);
        setIcon(PRESET_ICONS[0]);
        setError(null);
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setLoading(true);
        setError(null);
        try {
            await onSubmit({
                name: name.trim(),
                description: description.trim() || undefined,
                color,
                icon,
            });
            handleClose();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to create project");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
            <DialogContent className="sm:max-w-md">
                {/* Preview banner */}
                <div
                    className="absolute top-0 left-0 right-0 h-1.5 rounded-t-lg transition-colors duration-200"
                    style={{ backgroundColor: color }}
                />

                <DialogHeader className="mt-2">
                    <div className="flex items-center gap-3 mb-1">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                            style={{ backgroundColor: color + "1a", border: `1px solid ${color}33` }}
                        >
                            {icon}
                        </div>
                        <DialogTitle>New project</DialogTitle>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Icon picker */}
                    <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                            Icon
                        </Label>
                        <div className="flex flex-wrap gap-1.5">
                            {PRESET_ICONS.map((ic) => (
                                <button
                                    key={ic}
                                    type="button"
                                    onClick={() => setIcon(ic)}
                                    className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all
                    ${icon === ic
                                            ? "bg-primary/10 ring-1 ring-primary"
                                            : "bg-muted hover:bg-muted/80"
                                        }`}
                                >
                                    {ic}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Color picker */}
                    <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                            Color
                        </Label>
                        <div className="flex flex-wrap gap-2">
                            {PRESET_COLORS.map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setColor(c)}
                                    className={`w-7 h-7 rounded-full transition-transform
                    ${color === c ? "scale-110 ring-2 ring-offset-2 ring-offset-background ring-white/30" : "hover:scale-110"}`}
                                    style={{ backgroundColor: c }}
                                    aria-label={c}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Name */}
                    <div className="space-y-2">
                        <Label htmlFor="project-name">
                            Project name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="project-name"
                            placeholder="e.g. Marketing Website Redesign"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoFocus
                            required
                            maxLength={80}
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="project-desc">Description</Label>
                        <Textarea
                            id="project-desc"
                            placeholder="What is this project about?"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            maxLength={300}
                            className="resize-none"
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-destructive">{error}</p>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={!name.trim() || loading}>
                            {loading ? "Creating…" : "Create project"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}