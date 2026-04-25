"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function updateProject(projectId: string, data: any) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized");

  const project = await prisma.project.update({
    where: { id: projectId },
    data,
  });

  if (data.status === "COMPLETED") {
    const { createNotification } = await import("@/lib/notifications");
    if (project.projectManagerId) {
      await createNotification({
        userId: project.projectManagerId,
        title: "Project Completed",
        message: `The project "${project.name}" has been marked as completed.`,
        type: "PROJECT_COMPLETED",
        relatedId: project.id,
        relatedType: "PROJECT",
      });
    }
  }

  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath(`/admin/projects`);
}

export async function deleteProject(projectId: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized");

  await prisma.project.delete({
    where: { id: projectId },
  });

  revalidatePath(`/admin/projects`);
  // Will redirect on client
}

export async function archiveProject(projectId: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized");

  const project = await prisma.project.update({
    where: { id: projectId },
    data: { status: "COMPLETED" },
    include: {
      projectManager: { select: { id: true } }
    }
  });

  const { createNotification } = await import("@/lib/notifications");
  if (project.projectManagerId) {
    await createNotification({
      userId: project.projectManagerId,
      title: "Project Completed",
      message: `The project "${project.name}" has been marked as completed/archived.`,
      type: "PROJECT_COMPLETED",
      relatedId: project.id,
      relatedType: "PROJECT",
    });
  }

  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath(`/admin/projects`);
}
