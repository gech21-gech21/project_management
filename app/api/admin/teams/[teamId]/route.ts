import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// For Next.js 15, params should be awaited or handled differently
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> | { teamId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" }, 
        { status: 401 }
      );
    }

    // Handle params properly (works with both Promise and direct object)
    const { teamId } = await params;

    console.log("Attempting to delete team with ID:", teamId);

    if (!teamId) {
      return NextResponse.json(
        { error: "Team ID is required" }, 
        { status: 400 }
      );
    }

    // Check if team exists and get related data
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: true,
        projects: {
          select: {
            id: true,
            name: true,
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

    // Check if team has any projects
    if (team.projects && team.projects.length > 0) {
      return NextResponse.json(
        { 
          error: "Cannot delete team that has associated projects. Please reassign or delete the projects first.",
          projects: team.projects 
        },
        { status: 400 }
      );
    }

    // Use transaction to ensure all related records are deleted properly
    await prisma.$transaction(async (tx) => {
      // First delete all team members
      if (team.members && team.members.length > 0) {
        await tx.teamMember.deleteMany({
          where: { teamId: teamId },
        });
      }

      // Then delete the team
      await tx.team.delete({
        where: { id: teamId },
      });
    });

    return NextResponse.json({ 
      success: true,
      message: "Team deleted successfully" 
    });
    
  } catch (error: any) {
    console.error("Error deleting team:", error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2003') {
      return NextResponse.json(
        { 
          error: "Cannot delete team because it is referenced by other records. Please remove all references first.",
          details: error.meta
        },
        { status: 400 }
      );
    }
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: "Team not found or already deleted" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { 
        error: "Failed to delete team. Please try again.",
        details: error.message 
      },
      { status: 500 }
    );
  }
}