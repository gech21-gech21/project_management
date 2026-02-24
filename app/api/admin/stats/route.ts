import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get counts
    const [
      totalUsers,
      activeUsers,
      totalProjects,
      totalTasks,
      completedTasks,
      pendingTasks,
      totalTeams,
      totalDepartments
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: "ACTIVE" } }),
      prisma.project.count(),
      prisma.task.count(),
      prisma.task.count({ where: { status: "COMPLETED" } }),
      prisma.task.count({ where: { status: { in: ["TODO", "IN_PROGRESS", "REVIEW"] } } }),
      prisma.team.count(),
      prisma.department.count(),
    ]);

    return NextResponse.json({
      data: {
        totalUsers,
        activeUsers,
        totalProjects,
        totalTasks,
        completedTasks,
        pendingTasks,
        totalTeams,
        totalDepartments,
      },
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}