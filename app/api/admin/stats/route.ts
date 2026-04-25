import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get counts and analytics data
    const [
      totalUsers,
      activeUsers,
      totalProjects,
      totalTasks,
      completedTasks,
      pendingTasks,
      totalTeams,
      totalDepartments,
      taskStatusCounts,
      projectStatusCounts,
      TEAM_MEMBERCounts
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: "ACTIVE" } }),
      prisma.project.count(),
      prisma.task.count(),
      prisma.task.count({ where: { status: "COMPLETED" } }),
      prisma.task.count({ where: { status: { in: ["TODO", "IN_PROGRESS", "REVIEW"] } } }),
      prisma.team.count(),
      prisma.department.count(),
      
      // Task Status Breakdown
      prisma.task.groupBy({
        by: ['status'],
        _count: {
          id: true
        }
      }),
      
      // Project Status Breakdown
      prisma.project.groupBy({
        by: ['status'],
        _count: {
          id: true
        }
      }),
      
      // User Role Breakdown
      prisma.user.groupBy({
        by: ['role'],
        _count: {
          id: true
        }
      })
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
        analytics: {
          tasks: taskStatusCounts.map(item => ({ label: item.status, count: item._count.id })),
          projects: projectStatusCounts.map(item => ({ label: item.status, count: item._count.id })),
          roles: TEAM_MEMBERCounts.map(item => ({ label: item.role, count: item._count.id }))
        }
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
