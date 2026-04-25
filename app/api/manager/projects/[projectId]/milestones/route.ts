import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ projectId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || !["ADMIN", "PROJECT_MANAGER"].includes(session.user.role)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { projectId } = await context.params;
        const body = await request.json();
        const { name, description, dueDate } = body;

        if (!name) {
            return NextResponse.json({ error: "Milestone name is required" }, { status: 400 });
        }

        const milestone = await prisma.milestone.create({
            data: {
                name,
                description,
                dueDate: dueDate ? new Date(dueDate) : null,
                projectId
            }
        });

        return NextResponse.json({ data: milestone });
    } catch (error) {
        console.error("Error creating milestone:", error);
        return NextResponse.json(
            { error: "Failed to create milestone" },
            { status: 500 }
        );
    }
}
