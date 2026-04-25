"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function updateTask(taskId: string, data: any) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized");

  await prisma.task.update({
    where: { id: taskId },
    data,
  });

  revalidatePath("/admin/tasks");
}

export async function deleteTask(taskId: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized");

  await prisma.task.delete({
    where: { id: taskId },
  });

  revalidatePath("/admin/tasks");
}
