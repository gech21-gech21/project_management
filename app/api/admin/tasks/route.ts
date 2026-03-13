import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");

    const tasks = await prisma.task.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        project: {
          select: { name: true },
        },
        assignedTo: {
          select: { fullName: true },
        },
      },
    });

    return NextResponse.json({ data: tasks });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await request.json();
    const {
      title,
      description,
      taskCode,
      status,
      priority,
      dueDate,
      projectId,
      assignedToId,
    } = json;

    const task = await prisma.task.create({
      data: {
        title,
        description,
        taskCode,
        status,
        priority,
        dueDate,
        projectId,
        assignedToId,
        createdById: session.user.id,
      },
    });

    return NextResponse.json({ data: task }, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
