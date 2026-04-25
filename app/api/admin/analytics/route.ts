// app/api/admin/analytics/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Overview Stats
    let overview = { totalProjects: 0, totalTasks: 0, totalUsers: 0, totalDepartments: 0 };
    try {
      const [projectCount, taskCount, userCount, departmentCount] = await Promise.all([
        prisma.project.count(),
        prisma.task.count(),
        prisma.user.count(),
        prisma.department.count(),
      ]);
      overview = {
        totalProjects: projectCount,
        totalTasks: taskCount,
        totalUsers: userCount,
        totalDepartments: departmentCount,
      };
    } catch (e) {
      console.error("Overview stats error:", e);
    }

    // 2. Project Status Distribution
    let projectStatus: any = [];
    try {
      projectStatus = await prisma.project.groupBy({
        by: ['status'],
        _count: { id: true },
      });
    } catch (e) {
      console.error("Project status error:", e);
    }

    // 3. Task Status Distribution
    let taskStatus: any = [];
    try {
      taskStatus = await prisma.task.groupBy({
        by: ['status'],
        _count: { id: true },
      });
    } catch (e) {
      console.error("Task status error:", e);
    }

    // 4. Tasks by Priority
    let taskPriority: any = [];
    try {
      taskPriority = await prisma.task.groupBy({
        by: ['priority'],
        _count: { id: true },
      });
    } catch (e) {
      console.error("Task priority error:", e);
    }

    // 5. Department Breakdown
    let departmentBreakdown: any = [];
    try {
      departmentBreakdown = await prisma.department.findMany({
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              users: true,
            }
          }
        },
        take: 10 // Limit for performance
      });
    } catch (e) {
      console.error("Department breakdown error:", e);
    }

    // 6. Recent Activity
    let recentTasks: any = [];
    try {
      recentTasks = await prisma.task.findMany({
        take: 5,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          assignedTo: {
            select: {
              fullName: true,
            }
          },
          project: {
            select: {
              name: true,
            }
          }
        }
      });
    } catch (e) {
      console.error("Recent tasks error:", e);
    }

    return NextResponse.json({
      overview,
      projectStatus,
      taskStatus,
      taskPriority,
      departmentBreakdown,
      recentTasks,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Detailed analytics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics", detail: errorMessage },
      { status: 500 }
    );
  }
}
