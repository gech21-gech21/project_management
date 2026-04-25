// app/api/admin/teams/[teamId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamId } = await params;

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        teamLead: {
          select: {
            id: true,
            fullName: true,
            email: true,
            username: true,
            avatarUrl: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                username: true,
                avatarUrl: true,
                role: true,
              },
            },
          },
          orderBy: {
            joinedAt: "desc",
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    if (!team) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: team });
  } catch (error) {
    console.error("Error fetching team:", error);
    return NextResponse.json(
      { error: "Failed to fetch team" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamId } = await params;
    const body = await request.json();
    const { name, description, departmentId, teamLeadId } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Team name is required" },
        { status: 400 }
      );
    }

    // Check if another team with same name exists
    const existingTeam = await prisma.team.findFirst({
      where: {
        name,
        NOT: {
          id: teamId,
        },
      },
    });

    if (existingTeam) {
      return NextResponse.json(
        { error: "Another team with this name already exists" },
        { status: 400 }
      );
    }

    const team = await prisma.team.update({
      where: { id: teamId },
      data: {
        name,
        description,
        departmentId: departmentId || null,
        teamLeadId: teamLeadId || null,
      },
      include: {
        teamLead: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    // Notify new Team Lead if assigned
    if (teamLeadId && teamLeadId !== session.user.id) {
        const { createNotification } = await import("@/lib/notifications");
        await createNotification({
            userId: teamLeadId,
            title: "Assigned as Team Leader",
            message: `You have been assigned as the leader for team: "${team.name}"`,
            type: "TEAM_LEADER_ASSIGNED",
            relatedId: team.id,
            relatedType: "TEAM",
        });
    }

    return NextResponse.json({ data: team });
  } catch (error) {
    console.error("Error updating team:", error);
    return NextResponse.json(
      { error: "Failed to update team" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamId } = await params;

    // Check if team has members
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    if (!team) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      );
    }

    if (team._count.members > 0) {
      return NextResponse.json(
        { error: "Cannot delete team with existing members. Please remove all members first." },
        { status: 400 }
      );
    }

    await prisma.team.delete({
      where: { id: teamId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting team:", error);
    return NextResponse.json(
      { error: "Failed to delete team" },
      { status: 500 }
    );
  }
}
