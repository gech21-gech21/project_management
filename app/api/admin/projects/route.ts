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
  teamLeadId: z.string().uuid("Invalid team lead ID"),
  status: z
    .enum(["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"])
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

    // Check if team lead exists and has TEAMLEADER role
    const teamLead = await prisma.user.findFirst({
      where: {
        id: validatedData.teamLeadId,
        role: Role.TEAMLEADER,
      },
    });

    if (!teamLead) {
      return new NextResponse("Team lead not found or invalid role", {
        status: 400,
      });
    }

    // Create project with team lead
    const project = await prisma.project.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        startDate: new Date(validatedData.startDate),
        endDate: new Date(validatedData.endDate),
        status: validatedData.status as ProjectStatus,
        priority: validatedData.priority as Priority,
        teamLeadId: validatedData.teamLeadId,
      },
      include: {
        teamLead: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            tasks: true,
            // teamMembers: true, // Removed invalid property
          },
        },
      },
    });

    // Add team lead as a team member automatically
    await prisma.projectMember.create({
      data: {
        userId: validatedData.teamLeadId,
        projectId: project.id,
        role: MemberRole.MEMBER, // Default to MEMBER, adjust if needed
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
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            tasks: true,
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
