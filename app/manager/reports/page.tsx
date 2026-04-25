import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ReportsClient } from "./components/reports-client";

export default async function ManagerReportsPage() {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/auth");
  if (session.user.role !== "PROJECT_MANAGER") redirect("/dashboard");

  const projects = await prisma.project.findMany({
    where: { projectManagerId: session.user.id },
    include: {
      tasks: {
        include: {
          assignedTo: { select: { id: true, fullName: true, avatarUrl: true } },
        },
      },
      milestones: true,
      _count: { select: { tasks: true, projectMembers: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Aggregate stats across all projects
  const allTasks = projects.flatMap((p) => p.tasks);
  const blockedTasks = allTasks.filter((t) => (t as any).isBlocked);

  const stats = {
    totalProjects: projects.length,
    activeProjects: projects.filter((p) => p.status === "IN_PROGRESS").length,
    completedProjects: projects.filter((p) => p.status === "COMPLETED").length,
    totalTasks: allTasks.length,
    todoTasks: allTasks.filter((t) => t.status === "TODO").length,
    inProgressTasks: allTasks.filter((t) => t.status === "IN_PROGRESS").length,
    reviewTasks: allTasks.filter((t) => t.status === "REVIEW").length,
    completedTasks: allTasks.filter((t) => t.status === "COMPLETED").length,
    blockedTasks: blockedTasks.length,
    totalMilestones: projects.reduce((acc, p) => acc + p.milestones.length, 0),
    completedMilestones: projects.reduce(
      (acc, p) =>
        acc + p.milestones.filter((m) => m.status === "COMPLETED").length,
      0
    ),
  };

  // Overdue tasks (past dueDate and not completed)
  const now = new Date();
  const overdueTasks = allTasks.filter(
    (t) =>
      t.dueDate &&
      new Date(t.dueDate) < now &&
      t.status !== "COMPLETED"
  );

  return (
    <ReportsClient
      projects={projects as any}
      stats={stats}
      overdueTasks={overdueTasks as any}
      blockedTasks={blockedTasks as any}
    />
  );
}
