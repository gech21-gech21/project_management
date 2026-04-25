"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateTaskStatus(taskId: string, status: "TODO" | "IN_PROGRESS" | "REVIEW" | "COMPLETED") {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized");

  await prisma.task.update({
    where: { id: taskId },
    data: { status },
  });

  // Track history
  await prisma.taskHistory.create({
    data: {
      taskId,
      fieldChanged: "status",
      newValue: status,
      changedById: session.user.id,
      changeType: "STATUS_CHANGE",
    }
  });

  revalidatePath(`/member/tasks/${taskId}`);
}

export async function reportBlocker(taskId: string, blockerReason: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized");

  await prisma.task.update({
    where: { id: taskId },
    data: { isBlocked: true, blockerReason },
  });

  // Track history
  await prisma.taskHistory.create({
    data: {
      taskId,
      fieldChanged: "blocker",
      newValue: blockerReason,
      changedById: session.user.id,
      changeType: "UPDATE",
    }
  });

  revalidatePath(`/member/tasks/${taskId}`);
}

export async function addComment(taskId: string, content: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized");

  await prisma.comment.create({
    data: {
      content,
      taskId,
      userId: session.user.id,
    },
  });

  revalidatePath(`/member/tasks/${taskId}`);
}
