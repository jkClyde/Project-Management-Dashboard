import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        // ✅ USE NEXTAUTH (NOT SUPABASE)
        const session = await getServerSession(authOptions);

        console.log("SESSION:", session);

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const tasks = await prisma.task.findMany({
            where: {
                assignee: {
                    email: session.user.email,
                },
            },

            // 🔥 IMPORTANT: removes duplicate rows from joins
            distinct: ["id"],

            include: {
                project: true,
                assignee: true,
            },

            orderBy: {
                updatedAt: "desc",
            },
        });

        return NextResponse.json(tasks);
    } catch (err) {
        console.error("[TASKS/MINE ERROR]", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}