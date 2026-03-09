import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "TEAMLEADER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { taskId } = params;

    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        project: {
          projectManagerId: session.user.id,
        },
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            code: true,
            projectManager: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        taskHistory: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error("Error fetching task:", error);
    return NextResponse.json(
      { error: "Failed to fetch task" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "TEAMLEADER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { taskId } = params;
    const body = await req.json();
    const { status, priority, dueDate, estimatedHours, assignedToId } = body;

    // Verify task exists and belongs to team leader's project
    const existingTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        project: {
          projectManagerId: session.user.id,
        },
      },
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: "Task not found or not accessible" },
        { status: 404 }
      );
    }

    // Update task
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: status || existingTask.status,
        priority: priority || existingTask.priority,
        dueDate: dueDate ? new Date(dueDate) : existingTask.dueDate,
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : existingTask.estimatedHours,
        assignedToId: assignedToId !== undefined ? assignedToId : existingTask.assignedToId,
      },
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
        fieldChanged: "UPDATED",
        oldValue: JSON.stringify({
          status: existingTask.status,
          priority: existingTask.priority,
        }),
        newValue: JSON.stringify({
          status: updatedTask.status,
          priority: updatedTask.priority,
        }),
        changeType: "UPDATE",
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "TEAMLEADER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { taskId } = params;

    // Verify task exists and belongs to team leader's project
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        project: {
          projectManagerId: session.user.id,
        },
      },
    });

    if (!task) {
      return NextResponse.json(
        { error: "Task not found or not accessible" },
        { status: 404 }
      );
    }

    // Delete task (cascading will handle comments, history, etc.)
    await prisma.task.delete({
      where: { id: taskId },
    });

    return NextResponse.json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}