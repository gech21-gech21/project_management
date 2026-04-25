import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ taskId: string }> }
) {
    try {
        const { taskId } = await params;
        const session = await getServerSession(authOptions);

        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const json = await request.json();
        const {
            title,
            description,
            taskCode,
            status,
            priority,
            dueDate,
            projectId,
            assignedToId,
        } = json;

        const existingTask = await prisma.task.findUnique({
            where: { id: taskId },
            include: { project: { select: { name: true } } }
        });

        const task = await prisma.task.update({
            where: {
                id: taskId,
            },
            data: {
                title,
                description,
                taskCode,
                status,
                priority,
                dueDate,
                projectId,
                assignedToId,
            },
        });

        // Notify new assignee if assignment changed
        if (assignedToId && assignedToId !== existingTask?.assignedToId && assignedToId !== session.user.id) {
            await createNotification({
                userId: assignedToId,
                title: "Task Re-assigned",
                message: `You have been assigned the task: "${title}" in project "${existingTask?.project?.name || 'Unknown'}"`,
                type: "TASK_ASSIGNED",
                relatedId: task.id,
                relatedType: "TASK",
            });
        }

        return NextResponse.json({ data: task });
    } catch (error) {
        console.error("Error updating task:", error);
        return NextResponse.json(
            { error: "Failed to update task" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ taskId: string }> }
) {
    try {
        const { taskId } = await params;
        const session = await getServerSession(authOptions);

        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await prisma.task.delete({
            where: {
                id: taskId,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting task:", error);
        return NextResponse.json(
            { error: "Failed to delete task" },
            { status: 500 }
        );
    }
}
