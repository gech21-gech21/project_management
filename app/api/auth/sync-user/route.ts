import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "No authenticated session found" },
        { status: 401 },
      );
    }

    // Check if user exists in database
    const existingUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (existingUser) {
      return NextResponse.json({
        success: true,
        message: "User already exists in database",
        userId: existingUser.id,
      });
    }

    // Create user in database (set emailVerified in a separate update to satisfy generated types)
    const newUser = await prisma.user.create({
      data: {
        email: session.user.email,
        username: session.user.email.split("@")[0],
        fullName: session.user.name || "",
        avatarUrl: session.user.image || null,
        // Prisma requires `password` (schema mandates it). OAuth users don't have a password,
        // so store an empty string to satisfy the type and schema.
        password: "",
        role: "TEAM_MEMBER",
      },
    });

    // Mark email as verified for OAuth users
    await prisma.user.update({
      where: { id: newUser.id },
      // Use Prisma.UserUpdateInput to correctly type the update payload
      data: { emailVerified: new Date() } as Prisma.UserUpdateInput,
    });

    console.log("Synced OAuth user to database:", newUser.id);

    return NextResponse.json({
      success: true,
      message: "User synced to database successfully",
      userId: newUser.id,
    });
  } catch (error) {
    console.error("Error syncing user to database:", error);
    return NextResponse.json(
      { error: "Failed to sync user to database" },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}
