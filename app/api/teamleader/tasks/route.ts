// app/api/teamleader/tasks/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["ADMIN", "TEAMLEADER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    let { title, description, status, priority, dueDate, assignedToId, projectId, type, estimatedHours } = body;

    // Fallback mapping for PENDING status
    if (status === "PENDING") status = "TODO";

    if (!title || !projectId) {
      return NextResponse.json(
        { error: "Title and project ID are required" },
        { status: 400 }
      );
    }

    // Verify project exists and team leader has access
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { team: true },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // If user is team leader, verify they lead the team assigned to this project
    // OR they are the project manager of this project
    if (session.user.role === "TEAMLEADER") {
      const isProjectManager = project.projectManagerId === session.user.id;
      
      const team = await prisma.team.findFirst({
        where: { teamLeadId: session.user.id },
      });
      
      const isTeamLeadOfProject = team && project.teamId === team.id;

      if (!isProjectManager && !isTeamLeadOfProject) {
        return NextResponse.json(
          { error: "You don't have permission to create tasks for this project" },
          { status: 403 }
        );
      }
    }

    // If assignedToId is provided, verify the user is a member of the team
    if (assignedToId && project.team) {
      const teamMember = await prisma.teamMember.findFirst({
        where: {
          userId: assignedToId,
          teamId: project.team.id,
        },
      });
      if (!teamMember) {
        return NextResponse.json(
          { error: "Assigned user is not a member of the project team" },
          { status: 400 }
        );
      }
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: status || "TODO",
        priority: priority || "MEDIUM",
        type: type || "TASK",
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        assignedToId: assignedToId || null,
        projectId,
        createdById: session.user.id,
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

    return NextResponse.json({ data: task }, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}