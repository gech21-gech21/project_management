import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ taskId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!["ADMIN", "PROJECT_MANAGER"].includes(session.user.role)) {
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
        if (session.user.role === "PROJECT_MANAGER") {
            const isProjectManager = existingTask.project?.projectManagerId === session.user.id;
            
            const team = await prisma.team.findFirst({
                where: { teamLeadId: session.user.id },
            });
            
            const isTeamLeadOfProject = team && existingTask.project?.teamId === team.id;

            if (!isProjectManager && !isTeamLeadOfProject) {
                return NextResponse.json(
                    { error: "You don't have permission to update this task" },
                    { status: 403 }
                );
            }
        }

        // If assignedToId is provided, verify the user belongs to the project's team
        if (assignedToId) {
            if (!existingTask.project?.teamId) {
                return NextResponse.json(
                    { error: "This project has no team assigned. Cannot assign tasks to members." },
                    { status: 400 }
                );
            }

            const teamMember = await prisma.teamMember.findFirst({
                where: {
                    userId: assignedToId,
                    teamId: existingTask.project.teamId,
                },
            });
            
            if (!teamMember) {
                return NextResponse.json(
                    { error: "Assigned user is not a member of this project's team" },
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

        // NOTIFICATIONS
        // 1. If status changed, notify the assignee (if not the manager)
        if (status && status !== existingTask.status && updatedTask.assignedToId && updatedTask.assignedToId !== session.user.id) {
            await createNotification({
                userId: updatedTask.assignedToId,
                title: "Task Status Updated",
                message: `Manager updated status of "${updatedTask.title}" to ${status}`,
                type: "STATUS_CHANGE",
                relatedId: taskId,
                relatedType: "TASK",
            });
        }

        // 2. If assignment changed, notify new assignee
        if (assignedToId && assignedToId !== existingTask.assignedToId && assignedToId !== session.user.id) {
            await createNotification({
                userId: assignedToId,
                title: "New Task Assignment",
                message: `You have been assigned a task: "${updatedTask.title}"`,
                type: "TASK_ASSIGNED",
                relatedId: taskId,
                relatedType: "TASK",
            });
        }

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
    { params }: { params: Promise<{ taskId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!["ADMIN", "PROJECT_MANAGER"].includes(session.user.role)) {
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
        if (session.user.role === "PROJECT_MANAGER") {
            const isProjectManager = existingTask.project?.projectManagerId === session.user.id;
            
            const team = await prisma.team.findFirst({
                where: { teamLeadId: session.user.id },
            });
            
            const isTeamLeadOfProject = team && existingTask.project?.teamId === team.id;

            if (!isProjectManager && !isTeamLeadOfProject) {
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
