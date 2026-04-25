import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { WorkloadMatrix } from "@/app/manager/team/components/WorkloadMatrix";

export default async function ManagersTeamPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) redirect("/auth");
  if (session.user.role !== "PROJECT_MANAGER") redirect("/dashboard");

  // Get the team where this PM is the lead
  const team = await prisma.team.findFirst({
    where: { teamLeadId: session.user.id },
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
              specialization: true,
            },
          },
        },
      },
      department: true,
    },
  });

  // Also handle PMs who manage projects but aren't strictly "team leads"
  const memberIds = team?.members.map((m) => m.userId) ?? [];

  // Grab ALL tasks assigned to any member plus project info
  const allTasks = await prisma.task.findMany({
    where: {
      project: { projectManagerId: session.user.id },
    },
    include: {
      assignedTo: { select: { id: true, fullName: true } },
      project: { select: { id: true, name: true } },
    },
    orderBy: { dueDate: "asc" },
  });

  // Build per-member workload
  const memberWorkload = memberIds.map((uid) => {
    const memberTasks = allTasks.filter((t) => t.assignedToId === uid);
    return {
      userId: uid,
      todo: memberTasks.filter((t) => t.status === "TODO").length,
      inProgress: memberTasks.filter((t) => t.status === "IN_PROGRESS").length,
      review: memberTasks.filter((t) => t.status === "REVIEW").length,
      completed: memberTasks.filter((t) => t.status === "COMPLETED").length,
      total: memberTasks.length,
      activeTasks: memberTasks.filter(
        (t) => t.status !== "COMPLETED"
      ),
    };
  });

  return (
    <WorkloadMatrix
      team={team as any}
      memberWorkload={memberWorkload as any}
      allTasks={allTasks as any}
    />
  );
}
