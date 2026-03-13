import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "MEMBER" && session.user.role !== "USER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { taskId } = await params;
    const body = await req.json();
    const { status } = body;

    // Verify task is assigned to this member
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        assignedToId: session.user.id,
      },
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