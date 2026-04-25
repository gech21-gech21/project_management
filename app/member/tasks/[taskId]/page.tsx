import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TaskDetailClient } from "./components/TaskDetailClient";

interface PageProps {
  params: Promise<{
    taskId: string;
  }>;
}

export default async function MemberTaskDetailPage({ params }: PageProps) {
  const { taskId } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth");
  }

  // Ensure member has right role
  if (session.user.role !== "TEAM_MEMBER") {
    redirect("/dashboard");
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: {
        select: {
          name: true,
          projectManager: {
            select: { fullName: true }
          }
        }
      },
      assignedTo: {
        select: { fullName: true }
      },
      comments: {
        include: {
          user: {
            select: { fullName: true, avatarUrl: true }
          }
        },
        orderBy: { createdAt: 'desc' } // Most recent at top
      },
      attachments: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!task) {
    notFound();
  }

  // Ensure member can only view their assigned tasks.
  if (task.assignedToId !== session.user.id) {
    redirect("/member/tasks");
  }

  return (
    <div className="min-h-screen bg-gray-50/30 dark:bg-[#050505] py-8">
      <TaskDetailClient task={task} currentUser={session.user} />
    </div>
  );
}
