import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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
  teamId: z.string().uuid().optional().nullable(),
  departmentId: z.string().uuid().optional().nullable(),
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

    // Create project with project manager, team, and department
    const project = await prisma.project.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        startDate: new Date(validatedData.startDate),
        endDate: new Date(validatedData.endDate),
        status: validatedData.status as ProjectStatus,
        priority: validatedData.priority as Priority,
        projectManagerId: validatedData.projectManagerId,
        teamId: validatedData.teamId,
        departmentId: validatedData.departmentId,
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

    // Fetch users based on department or team
    const membersToAdd: { userId: string, role: MemberRole }[] = [];
    
    // Always add the manager
    membersToAdd.push({ userId: validatedData.projectManagerId, role: MemberRole.MEMBER });

    if (validatedData.teamId) {
      const teamMembers = await prisma.teamMember.findMany({
        where: { teamId: validatedData.teamId },
        select: { userId: true },
      });
      teamMembers.forEach(tm => membersToAdd.push({ userId: tm.userId, role: MemberRole.MEMBER }));
    }

    if (validatedData.departmentId) {
      const deptMembers = await prisma.user.findMany({
        where: { departmentId: validatedData.departmentId },
        select: { id: true },
      });
      deptMembers.forEach(u => membersToAdd.push({ userId: u.id, role: MemberRole.MEMBER }));
    }

    // Deduplicate array by userId
    const uniqueMap = new Map();
    for (const m of membersToAdd) {
      if (!uniqueMap.has(m.userId)) {
        uniqueMap.set(m.userId, m);
      }
    }
    const uniqueMembers = Array.from(uniqueMap.values());

    if (uniqueMembers.length > 0) {
      await prisma.projectMember.createMany({
        data: uniqueMembers.map(m => ({
          projectId: project.id,
          userId: m.userId,
          role: m.role,
        })),
        skipDuplicates: true,
      });
    }

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