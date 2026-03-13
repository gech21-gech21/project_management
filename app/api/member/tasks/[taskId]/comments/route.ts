import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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

    if (session.user.role !== "MEMBER" && session.user.role !== "USER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { taskId } = await params;
    const body = await req.json();
    const { content } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: "Comment content is required" }, { status: 400 });
    }

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

    // Create the comment
    const newComment = await prisma.comment.create({
      data: {
        content,
        taskId,
        userId: session.user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: newComment,
    });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
