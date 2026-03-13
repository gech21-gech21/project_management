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

    if (session.user.role !== "TEAMLEADER" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { taskId } = await params;
    const body = await req.json();
    const { content } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: "Comment content is required" }, { status: 400 });
    }

    // Verify task belongs to a project managed by this team leader (or is admin)
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          select: {
            projectManagerId: true,
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (session.user.role === "TEAMLEADER" && task.project.projectManagerId !== session.user.id) {
       // Check if they are the team lead of the team assigned to this project
       const project = await prisma.project.findUnique({
           where: { id: task.projectId },
           include: { team: true }
       });
       
       if (project?.team?.teamLeadId !== session.user.id) {
           return NextResponse.json({ error: "Forbidden: You are not the leader of this project's team" }, { status: 403 });
       }
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
