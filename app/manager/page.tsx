import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ManagerDashboardClient } from "./components/manager-dashboard-client";

export default async function ManagerDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth");
  }

  if (session.user.role !== "PROJECT_MANAGER") {
    redirect("/dashboard");
  }

  // Fetch projects assigned to this team leader
  const [assignedProjects, teamInfo] = await Promise.all([
    prisma.project.findMany({
      where: {
        projectManagerId: session.user.id,
      },
      include: {
        tasks: {
          include: {
            assignedTo: {
              select: {
                id: true,
                fullName: true,
                email: true,
                avatarUrl: true,
                role: true,
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
                    role: true,
                  },
                },
              },
              orderBy: {
                createdAt: "desc",
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        projectMembers: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                avatarUrl: true,
                role: true,
              },
            },
          },
        },
        _count: {
          select: {
            tasks: true,
            projectMembers: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.team.findFirst({
      where: {
        teamLeadId: session.user.id,
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                avatarUrl: true,
                role: true,
              },
            },
          },
        },
      },
    }),
  ]);

  // Calculate stats
  const stats = {
    totalProjects: assignedProjects.length,
    activeProjects: assignedProjects.filter(p => p.status === "IN_PROGRESS").length,
    completedProjects: assignedProjects.filter(p => p.status === "COMPLETED").length,
    totalTasks: assignedProjects.reduce((acc, p) => acc + p._count.tasks, 0),
    pendingTasks: assignedProjects.reduce((acc, p) => 
      acc + p.tasks.filter(t => t.status === "TODO" || t.status === "IN_PROGRESS").length, 0),
    completedTasks: assignedProjects.reduce((acc, p) => 
      acc + p.tasks.filter(t => t.status === "COMPLETED").length, 0),
  };

  return (
    <ManagerDashboardClient
      projects={assignedProjects}
      teamInfo={teamInfo}
      stats={stats}
    />
  );
}
