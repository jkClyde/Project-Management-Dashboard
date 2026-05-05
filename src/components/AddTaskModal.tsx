// components/AddTaskModal.tsx
"use client";

import { useState, useEffect } from "react";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { TaskDetail } from "../../types/task";
import { ProjectDetail } from "@/hooks/useProjectDetail";
import { TaskStatus, TaskPriority } from "../../types/dashboard";

interface AddTaskModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (input: {
        title: string;
        description?: string;
        status?: TaskStatus;
        priority?: TaskPriority;
        assigneeId?: string;
        dueDate?: Date;
    }) => void;
    onUpdate?: (taskId: string, input: {
        title?: string;
        description?: string;
        priority?: TaskPriority;
        assigneeId?: string | null;
        dueDate?: Date | null;
    }) => void;
    defaultStatus?: TaskStatus;
    editTask?: TaskDetail | null;
    members: ProjectDetail["members"];
}

const PRIORITIES: { value: TaskPriority; label: string }[] = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "urgent", label: "Urgent" },
];

const STATUSES: { value: TaskStatus; label: string }[] = [
    { value: "todo", label: "To Do" },
    { value: "in_progress", label: "In Progress" },
    { value: "done", label: "Done" },
];

export default function AddTaskModal({
    open,
    onClose,
    onSubmit,
    onUpdate,
    defaultStatus = "todo",
    editTask,
    members,
}: AddTaskModalProps) {

    const isEdit = !!editTask;

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState<TaskStatus>(defaultStatus);
    const [priority, setPriority] = useState<TaskPriority>("medium");
    const [assigneeId, setAssigneeId] = useState<string>("none");
    const [dueDate, setDueDate] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (editTask) {
            setTitle(editTask.title);
            setDescription(editTask.description ?? "");

            // 🔥 FIX NULL TYPES
            setStatus((editTask.status ?? "todo") as TaskStatus);
            setPriority((editTask.priority ?? "medium") as TaskPriority);

            setAssigneeId(editTask.assigneeId ?? "none");

            setDueDate(
                editTask.dueDate
                    ? new Date(editTask.dueDate).toISOString().split("T")[0]
                    : ""
            );
        } else {
            setTitle("");
            setDescription("");
            setStatus(defaultStatus);
            setPriority("medium");
            setAssigneeId("none");
            setDueDate("");
        }
    }, [editTask, defaultStatus, open]);

    const handleClose = () => {
        setLoading(false);
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        setLoading(true);

        const payload = {
            title: title.trim(),
            description: description.trim() || undefined,
            priority,
            assigneeId: assigneeId === "none" ? undefined : assigneeId,
            dueDate: dueDate ? new Date(dueDate) : undefined,
        };

        if (isEdit && onUpdate && editTask) {
            onUpdate(editTask.id, {
                ...payload,
                assigneeId: assigneeId === "none" ? null : assigneeId,
                dueDate: dueDate ? new Date(dueDate) : null,
            });
        } else {
            onSubmit({ ...payload, status });
        }

        setLoading(false);
        handleClose();
    };

    return (
        <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Edit task" : "Add task"}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">

                    <div className="space-y-2">
                        <Label>Title</Label>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">

                        {!isEdit && (
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {STATUSES.map((s) => (
                                            <SelectItem key={s.value} value={s.value}>
                                                {s.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Priority</Label>
                            <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {PRIORITIES.map((p) => (
                                        <SelectItem key={p.value} value={p.value}>
                                            {p.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Assignee</Label>
                            <Select value={assigneeId} onValueChange={setAssigneeId}>
                                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Unassigned</SelectItem>
                                    {members.map(({ user }) => (
                                        <SelectItem key={user.id} value={user.id}>
                                            {user.fullName ?? user.email}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Due date</Label>
                            <Input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                            />
                        </div>

                    </div>

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={!title.trim() || loading}>
                            {loading ? "Saving..." : isEdit ? "Save" : "Add Task"}
                        </Button>
                    </DialogFooter>

                </form>
            </DialogContent>
        </Dialog>
    );
}