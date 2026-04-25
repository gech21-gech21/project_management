//admin/projects/page.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProjectsClient } from "./components/projects-client";

export default async function AdminProjectsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  // Fetch initial data
  const [projects] = await Promise.all([
    prisma.project.findMany({
      include: {
        projectManager: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
          },
        },
        team: {
          include: {
            department: {
              select: {
                id: true,
                name: true,
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
    prisma.user.findMany({
      where: {
        role: "PROJECT_MANAGER", // Make sure this matches your role enum
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        avatarUrl: true,
      },
      orderBy: {
        fullName: "asc",
      },
    }),
  ]);

  // Map projects directly, admin is always the project manager
  const projectsForClient = projects.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description ?? null,
    code: p.code ?? null,
    status: p.status,
    priority: p.priority,
    startDate: p.startDate ?? null,
    endDate: p.endDate ?? null,
    budget: p.budget ?? null,
    actualCost: p.actualCost ?? null,
    progress: p.progress ?? 0,
    teamId: p.teamId ?? null,
    projectManagerId: p.projectManagerId ?? null,
    createdById: p.createdById ?? null,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    _count: {
      tasks: p._count.tasks,
      projectMembers: p._count.projectMembers,
    },
    department: p.team?.department ?? null,
    departmentId: p.team?.department?.id ?? null,
    team: p.team,
  }));

  return <ProjectsClient initialProjects={projectsForClient} />;
}
