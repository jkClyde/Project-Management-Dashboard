// src/lib/actions/task.ts
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type TaskStatus = "todo" | "in_progress" | "done";
type TaskPriority = "low" | "medium" | "high" | "urgent";

// ✅ FIXED AUTH (NextAuth instead of Supabase)
async function getAuthUser() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        throw new Error("Not authenticated");
    }

    const profile = await prisma.profile.findFirst({
        where: {
            email: session.user.email,
        },
    });

    if (!profile) {
        throw new Error("Profile not found");
    }

    return profile;
}

// ── Get project ─────────────────────────────────────────────
export async function getProjectDetail(projectId: string) {
    const user = await getAuthUser();

    return prisma.project.findFirstOrThrow({
        where: {
            id: projectId,
            OR: [
                { ownerId: user.id },
                { members: { some: { userId: user.id } } },
            ],
        },
        include: {
            owner: {
                select: { id: true, fullName: true, avatarUrl: true, email: true },
            },
            members: {
                include: {
                    user: {
                        select: { id: true, fullName: true, avatarUrl: true, email: true },
                    },
                },
            },
            tasks: {
                include: {
                    assignee: {
                        select: { id: true, fullName: true, avatarUrl: true },
                    },
                },
                orderBy: [{ position: "asc" }, { createdAt: "asc" }],
            },
        },
    });
}

// ── Create task ─────────────────────────────────────────────
export async function createTask(input: {
    projectId: string;
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    assigneeId?: string;
    dueDate?: Date;
}) {
    await getAuthUser();

    const taskStatus = input.status ?? "todo";

    const lastTask = await prisma.task.findFirst({
        where: { projectId: input.projectId, status: taskStatus },
        orderBy: { position: "desc" },
        select: { position: true },
    });

    const task = await prisma.task.create({
        data: {
            projectId: input.projectId,
            title: input.title,
            description: input.description ?? null,
            status: taskStatus,
            priority: input.priority ?? "medium",
            assigneeId: input.assigneeId ?? null,
            dueDate: input.dueDate ?? null,
            position: (lastTask?.position ?? -1) + 1,
        },
        include: {
            assignee: {
                select: { id: true, fullName: true, avatarUrl: true },
            },
        },
    });

    revalidatePath(`/projects/${input.projectId}`);
    return task;
}

// ── Update ─────────────────────────────────────────────
export async function updateTask(taskId: string, input: any) {
    await getAuthUser();

    const task = await prisma.task.update({
        where: { id: taskId },
        data: input,
    });

    revalidatePath(`/projects/${task.projectId}`);
    return task;
}

// ── Move ─────────────────────────────────────────────
export async function moveTask(
    taskId: string,
    newStatus: TaskStatus,
    newPosition: number
) {
    await getAuthUser();

    const task = await prisma.task.update({
        where: { id: taskId },
        data: { status: newStatus, position: newPosition },
    });

    revalidatePath(`/projects/${task.projectId}`);
    return task;
}

// ── Delete ─────────────────────────────────────────────
export async function deleteTask(taskId: string) {
    await getAuthUser();

    const task = await prisma.task.delete({
        where: { id: taskId },
    });

    revalidatePath(`/projects/${task.projectId}`);
}


export async function getMyTasks() {
    const user = await getAuthUser();

    const tasks = await prisma.task.findMany({
        where: { assigneeId: user.id },
        include: {
            assignee: {
                select: { id: true, fullName: true, avatarUrl: true, email: true },
            },
            project: {
                select: { id: true, name: true, color: true },
            },
        },
        orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    });

    return tasks.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description ?? null,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate ? t.dueDate.toISOString() : null,
        projectId: t.projectId,
        projectName: t.project.name,
        projectColor: t.project.color ?? "#6366f1",
        assignee: t.assignee
            ? {
                id: t.assignee.id,
                fullName: t.assignee.fullName ?? null,
                avatarUrl: t.assignee.avatarUrl ?? null,
                email: t.assignee.email ?? null,
            }
            : null,
        createdAt: t.createdAt?.toISOString() ?? new Date().toISOString(),
        updatedAt: t.updatedAt?.toISOString() ?? new Date().toISOString(),
        comments: [], // comments are loaded separately when opening a task
    }));
}