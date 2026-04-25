"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { Role, UserStatus } from "@prisma/client";
import bcrypt from "bcrypt";

export async function updateUser(userId: string, data: { fullName?: string; email?: string; role?: Role; status?: UserStatus; departmentId?: string | null }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized");

    // Uniqueness checks
    if (data.email) {
      const existingEmail = await prisma.user.findFirst({
        where: { 
          email: data.email,
          NOT: { id: userId }
        }
      });
      if (existingEmail) return { success: false, error: "A user with this email already exists." };
    }

    await prisma.user.update({
      where: { id: userId },
      data,
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    console.error("Update user error:", error);
    return { success: false, error: "Failed to update user. Please try again." };
  }
}

export async function deleteUser(userId: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized");

  await prisma.user.delete({
    where: { id: userId },
  });

  revalidatePath("/admin/users");
}

export async function createUser(data: { fullName: string; email: string; role: Role; status: UserStatus; username: string; departmentId: string | null }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized");

    // Uniqueness checks
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email },
          { username: data.username }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.email === data.email) {
        return { success: false, error: "A user with this email already exists." };
      }
      if (existingUser.username === data.username) {
        return { success: false, error: "A user with this username already exists." };
      }
    }

    const hashedPassword = await bcrypt.hash("temporaryPassword123!", 10);

    await prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    console.error("Create user error:", error);
    return { success: false, error: "Failed to create user. Please try again." };
  }
}
