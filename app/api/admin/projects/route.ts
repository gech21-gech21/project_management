import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { ProjectStatus, Priority, MemberRole, Role } from "@prisma/client";

const projectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  projectManagerId: z.string().uuid("Invalid project manager ID"),
  status: z
    .enum([
      "PLANNING",
      "IN_PROGRESS",
      "ON_HOLD",
      "COMPLETED",
      "CANCELLED",
    ])
    .default("PLANNING"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const body = await req.json();
    const validatedData = projectSchema.parse(body);

    // Check if project manager exists and has TEAMLEADER role
    const manager = await prisma.user.findFirst({
      where: {
        id: validatedData.projectManagerId,
        role: Role.TEAMLEADER,
      },
    });

    if (!manager) {
      return new NextResponse("Project manager not found or invalid role", {
        status: 400,
      });
    }

    // Create project with project manager
    const project = await prisma.project.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        startDate: new Date(validatedData.startDate),
        endDate: new Date(validatedData.endDate),
        status: validatedData.status as ProjectStatus,
        priority: validatedData.priority as Priority,
        projectManagerId: validatedData.projectManagerId,
      },
      include: {
        projectManager: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            tasks: true,
            projectMembers: true,
          },
        },
      },
    });

    // Add project manager as a project member automatically
    await prisma.projectMember.create({
      data: {
        userId: validatedData.projectManagerId,
        projectId: project.id,
        role: MemberRole.MEMBER,
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), {
        status: 400,
      });
    }
    console.error("[PROJECTS_POST]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "100");
    const status = searchParams.get("status");

    const projects = await prisma.project.findMany({
      take: limit,
      where: status ? { status: status as ProjectStatus } : undefined,
      include: {
        projectManager: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            tasks: true,
            projectMembers: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error("[PROJECTS_GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}