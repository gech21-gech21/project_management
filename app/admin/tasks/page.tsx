import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TasksClient } from "./components/TasksClient";

export default async function AdminTasksPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const tasks = await prisma.task.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      project: { select: { name: true } },
      assignedTo: { select: { fullName: true } }
    }
  });

  return <TasksClient initialTasks={tasks} />;
}
