// src/lib/actions/prisma.ts
"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type ProjectStatus = "active" | "archived" | "completed";

// ── Exported row type (used by hooks for full inference) ────────────────────
export type ProjectRow = {
    id: string;
    name: string;
    description: string;
    color: string;
    icon: string;
    status: ProjectStatus;
    ownerId: string;
    createdAt: Date;
    updatedAt: Date;
    ownerName: string;
    ownerAvatar: string;
    memberCount: number;
    taskCount: number;
    tasksCompleted: number;
};

// ── Auth helper ─────────────────────────────────────────────────────────────
async function getAuthProfile() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        throw new Error("Not authenticated");
    }

    const existingProfile = await prisma.profile.findFirst({
        where: {
            email: session.user.email,
        },
    });

    if (existingProfile) {
        return existingProfile;
    }

    return prisma.profile.create({
        data: {
            id: crypto.randomUUID(),
            email: session.user.email,
            fullName: session.user.name ?? null,
            avatarUrl: session.user.image ?? null,
        },
    });
}

export async function syncProfile() {
    return getAuthProfile();
}

// ── Get projects ────────────────────────────────────────────────────────────
export async function getProjects(status?: ProjectStatus | "all"): Promise<ProjectRow[]> {
    const profile = await getAuthProfile();

    const memberships = await prisma.projectMember.findMany({
        where: {
            userId: profile.id,
        },
        select: {
            projectId: true,
            role: true,
        },
    });

    const memberProjectIds = memberships.map((member) => member.projectId);

    const projects = await prisma.project.findMany({
        where: {
            AND: [
                {
                    OR: [
                        { ownerId: profile.id },
                        { id: { in: memberProjectIds } },
                    ],
                },
                status && status !== "all" ? { status } : {},
            ],
        },
        orderBy: {
            updatedAt: "desc",
        },
    });

    const projectIds = projects.map((project) => project.id);
    const ownerIds = [...new Set(projects.map((project) => project.ownerId))];

    const owners = await prisma.profile.findMany({
        where: { id: { in: ownerIds } },
        select: { id: true, fullName: true, avatarUrl: true },
    });

    const members = await prisma.projectMember.findMany({
        where: { projectId: { in: projectIds } },
        select: { projectId: true, userId: true, role: true },
    });

    const tasks = await prisma.task.findMany({
        where: { projectId: { in: projectIds } },
        select: { projectId: true, status: true },
    });

    return projects.map((project) => {
        const owner = owners.find((item) => item.id === project.ownerId);
        const projectMembers = members.filter((m) => m.projectId === project.id);
        const projectTasks = tasks.filter((t) => t.projectId === project.id);

        return {
            id: project.id,
            name: project.name,
            description: project.description ?? "",
            color: project.color ?? "#6366f1",
            icon: project.icon ?? "📁",
            status: (project.status ?? "active") as ProjectStatus,
            ownerId: project.ownerId,
            createdAt: project.createdAt ?? new Date(),
            updatedAt: project.updatedAt ?? new Date(),
            ownerName: owner?.fullName ?? "",
            ownerAvatar: owner?.avatarUrl ?? "",
            memberCount: projectMembers.length,
            taskCount: projectTasks.length,
            tasksCompleted: projectTasks.filter((t) => t.status === "done").length,
        };
    });
}

// ── Create project ──────────────────────────────────────────────────────────
export async function createProject(input: {
    name: string;
    description?: string;
    color?: string;
    icon?: string;
}) {
    const profile = await getAuthProfile();

    const project = await prisma.$transaction(async (tx) => {
        const createdProject = await tx.project.create({
            data: {
                name: input.name,
                description: input.description ?? null,
                color: input.color ?? "#6366f1",
                icon: input.icon ?? "📁",
                ownerId: profile.id,
            },
        });

        await tx.projectMember.create({
            data: {
                projectId: createdProject.id,
                userId: profile.id,
                role: "admin",
            },
        });

        return createdProject;
    });

    revalidatePath("/projects");
    return project;
}

// ── Update project ──────────────────────────────────────────────────────────
export async function updateProject(
    id: string,
    input: {
        name?: string;
        description?: string;
        color?: string;
        icon?: string;
        status?: ProjectStatus;
    }
) {
    const profile = await getAuthProfile();

    const project = await prisma.project.findFirst({
        where: { id, OR: [{ ownerId: profile.id }] },
    });

    const adminMember = await prisma.projectMember.findFirst({
        where: { projectId: id, userId: profile.id, role: "admin" },
    });

    if (!project && !adminMember) {
        throw new Error("Project not found or permission denied");
    }

    const updated = await prisma.project.update({
        where: { id },
        data: {
            ...(input.name !== undefined ? { name: input.name } : {}),
            ...(input.description !== undefined ? { description: input.description } : {}),
            ...(input.color !== undefined ? { color: input.color } : {}),
            ...(input.icon !== undefined ? { icon: input.icon } : {}),
            ...(input.status !== undefined ? { status: input.status } : {}),
        },
    });

    revalidatePath("/projects");
    revalidatePath(`/projects/${id}`);
    return updated;
}

export async function archiveProject(id: string) {
    return updateProject(id, { status: "archived" });
}

// ── Delete project ──────────────────────────────────────────────────────────
export async function deleteProject(id: string) {
    const profile = await getAuthProfile();

    await prisma.project.deleteMany({
        where: { id, ownerId: profile.id },
    });

    revalidatePath("/projects");
}

// ── Get single project ──────────────────────────────────────────────────────
export async function getProject(id: string) {
    const profile = await getAuthProfile();

    const project = await prisma.project.findFirst({ where: { id } });

    if (!project) {
        throw new Error("Project not found");
    }

    const membership = await prisma.projectMember.findFirst({
        where: { projectId: id, userId: profile.id },
    });

    if (project.ownerId !== profile.id && !membership) {
        throw new Error("Project not found or permission denied");
    }

    const owner = await prisma.profile.findUnique({
        where: { id: project.ownerId },
        select: { fullName: true, avatarUrl: true, email: true },
    });

    const members = await prisma.projectMember.findMany({
        where: { projectId: id },
        orderBy: { joinedAt: "asc" },
    });

    const memberProfiles = await prisma.profile.findMany({
        where: { id: { in: members.map((m) => m.userId) } },
        select: { id: true, fullName: true, avatarUrl: true, email: true },
    });

    const tasks = await prisma.task.findMany({
        where: { projectId: id },
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    });

    return {
        ...project,
        color: project.color ?? "#6366f1",
        icon: project.icon ?? "📁",
        status: project.status ?? "active",
        createdAt: project.createdAt ?? new Date(),
        updatedAt: project.updatedAt ?? new Date(),
        owner,
        members: members.map((member) => ({
            ...member,
            user: memberProfiles.find((p) => p.id === member.userId) ?? null,
        })),
        tasks,
        labels: [],
    };
}