// app/api/teamleader/tasks/[taskId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
    request: NextRequest,
    { params }: { params: { taskId: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!["ADMIN", "TEAMLEADER"].includes(session.user.role)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { taskId } = await params;
        const body = await request.json();
        let { title, description, status, priority, dueDate, assignedToId } = body;

        // Fallback mapping for PENDING status
        if (status === "PENDING") status = "TODO";

        // Get the task with project and team details
        const existingTask = await prisma.task.findUnique({
            where: { id: taskId },
            include: {
                project: {
                    include: {
                        team: true
                    }
                }
            }
        });

        if (!existingTask) {
            return NextResponse.json(
                { error: "Task not found" },
                { status: 404 }
            );
        }

        // Verify team leader has permission to update this task
        if (session.user.role === "TEAMLEADER") {
            const team = await prisma.team.findFirst({
                where: { teamLeadId: session.user.id },
            });
            if (!team || !existingTask.project?.team || team.id !== existingTask.project.team.id) {
                return NextResponse.json(
                    { error: "You don't have permission to update this task" },
                    { status: 403 }
                );
            }
        }

        // If assignedToId is provided, verify the user is a member of the team
        if (assignedToId && existingTask.project?.team) {
            const teamMember = await prisma.teamMember.findFirst({
                where: {
                    userId: assignedToId,
                    teamId: existingTask.project.team.id,
                },
            });
            if (!teamMember) {
                return NextResponse.json(
                    { error: "Assigned user is not a member of the project team" },
                    { status: 400 }
                );
            }
        }

        const updatedTask = await prisma.task.update({
            where: { id: taskId },
            data: {
                title,
                description,
                status,
                priority,
                dueDate: dueDate ? new Date(dueDate) : null,
                assignedToId: assignedToId || null,
            },
            include: {
                assignedTo: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                    },
                },
                createdBy: {
                    select: {
                        id: true,
                        fullName: true,
                    },
                },
            },
        });

        return NextResponse.json({ data: updatedTask });
    } catch (error) {
        console.error("Error updating task:", error);
        return NextResponse.json(
            { error: "Failed to update task" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { taskId: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!["ADMIN", "TEAMLEADER"].includes(session.user.role)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { taskId } = await params;

        // Get the task with project and team details
        const existingTask = await prisma.task.findUnique({
            where: { id: taskId },
            include: {
                project: {
                    include: {
                        team: true
                    }
                }
            }
        });

        if (!existingTask) {
            return NextResponse.json(
                { error: "Task not found" },
                { status: 404 }
            );
        }

        // Verify team leader has permission to delete this task
        if (session.user.role === "TEAMLEADER") {
            const team = await prisma.team.findFirst({
                where: { teamLeadId: session.user.id },
            });
            if (!team || !existingTask.project?.team || team.id !== existingTask.project.team.id) {
                return NextResponse.json(
                    { error: "You don't have permission to delete this task" },
                    { status: 403 }
                );
            }
        }

        await prisma.task.delete({
            where: { id: taskId },
        });

        return NextResponse.json({ message: "Task deleted successfully" });
    } catch (error) {
        console.error("Error deleting task:", error);
        return NextResponse.json(
            { error: "Failed to delete task" },
            { status: 500 }
        );
    }
}