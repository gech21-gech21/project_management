import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "TEAMLEADER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const {
      title,
      description,
      taskCode,
      status,
      priority,
      type,
      dueDate,
      estimatedHours,
      projectId,
      assignedToId,
    } = body;

    // Validate required fields
    if (!title || !projectId) {
      return NextResponse.json(
        { error: "Title and projectId are required" },
        { status: 400 }
      );
    }

    // Verify that the project belongs to this team leader
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        projectManagerId: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found or not assigned to you" },
        { status: 404 }
      );
    }

    // Create task
    const task = await prisma.task.create({
      data: {
        title,
        description: description || null,
        taskCode: taskCode || `TSK-${Date.now().toString().slice(-6)}`,
        status: status || "TODO",
        priority: priority || "MEDIUM",
        type: type || "TASK",
        dueDate: dueDate ? new Date(dueDate) : null,
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null,
        projectId,
        assignedToId: assignedToId || null,
        createdById: session.user.id,
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
          },
        },
      },
    });

    // Create task history
    await prisma.taskHistory.create({
      data: {
        taskId: task.id,
        fieldChanged: "CREATED",
        oldValue: null,
        newValue: "Task created",
        changeType: "CREATE",
        changedById: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "TEAMLEADER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");

    const where: any = {
      project: {
        projectManagerId: session.user.id,
      },
    };

    if (projectId) {
      where.projectId = projectId;
    }

    if (status) {
      where.status = status;
    }

    const tasks = await prisma.task.findMany({
      where,
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
        _count: {
          select: {
            comments: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}