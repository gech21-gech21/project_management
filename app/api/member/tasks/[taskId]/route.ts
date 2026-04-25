import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "TEAM_MEMBER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { taskId } = await params;
    const body = await req.json();
    const { status } = body;

    // Verify task is assigned to this member and find project manager
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        assignedToId: session.user.id,
      },
      include: {
        project: {
          select: {
            projectManagerId: true,
            name: true,
          }
        }
      }
    });

    if (!task) {
      return NextResponse.json(
        { error: "Task not found or not assigned to you" },
        { status: 404 }
      );
    }

    // Update task status
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { status },
      include: {
        assignedTo: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Create task history
    await prisma.taskHistory.create({
      data: {
        taskId,
        fieldChanged: "STATUS",
        oldValue: task.status,
        newValue: status,
        changeType: "STATUS_CHANGE",
        changedById: session.user.id,
      },
    });

    // Notify Project Manager
    if (task.project.projectManagerId) {
        const isCompleted = status === "COMPLETED";
        await createNotification({
            userId: task.project.projectManagerId,
            title: isCompleted ? "Task Completed" : "Task Status Updated",
            message: isCompleted 
                ? `${session.user.name || 'A team member'} finished the task: "${task.title}"`
                : `${session.user.name || 'A team member'} updated status of "${task.title}" to ${status}`,
            type: isCompleted ? "TASK_COMPLETED" : "STATUS_CHANGE",
            relatedId: taskId,
            relatedType: "TASK",
        });
    }

    return NextResponse.json({
      success: true,
      data: updatedTask,
    });
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}
