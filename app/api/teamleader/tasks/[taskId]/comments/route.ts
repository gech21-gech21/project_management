import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "TEAMLEADER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Await the params in Next.js 15
    const { taskId } = await params;
    const body = await req.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json(
        { error: "Comment content is required" },
        { status: 400 }
      );
    }

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

    // Create comment - FIXED: Use connect instead of taskId field
    const comment = await prisma.comment.create({
      data: {
        content,
        user: {
          connect: { id: session.user.id }
        },
        task: {
          connect: { id: taskId }
        }
      },
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
    });

    return NextResponse.json({
      success: true,
      data: comment,
    });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "TEAMLEADER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { taskId } = await params;

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

    const comments = await prisma.comment.findMany({
      where: {
        taskId,
      },
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
    });

    return NextResponse.json({
      success: true,
      data: comments,
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}