import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!["ADMIN", "PROJECT_MANAGER"].includes(session.user.role)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { projectId } = await params;

        // For team leaders, verify they have access to this project
        let projectQuery: any = {
            where: { id: projectId },
            include: {
                department: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                team: {
                    select: {
                        id: true,
                        name: true,
                        teamLead: {
                            select: {
                                id: true,
                                fullName: true,
                                email: true,
                            },
                        },
                    },
                },
                projectManager: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        department: {
                            select: {
                                name: true,
                            },
                        },
                        teamMemberships: {
                            include: {
                                team: {
                                    include: {
                                        teamLead: {
                                            select: {
                                                fullName: true,
                                                email: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                createdBy: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                    },
                },
                tasks: {
                    include: {
                        assignedTo: {
                            select: {
                                id: true,
                                fullName: true,
                                email: true,
                            },
                        },
                        createdBy: {
                            select: {
                                id: true,
                                fullName: true,
                            },
                        },
                        subtasks: true,
                        parentTask: true
                    },
                    orderBy: {
                        createdAt: "desc",
                    },
                },
                milestones: true,
                _count: {
                    select: {
                        tasks: true,
                        projectMembers: true,
                    },
                },
            },
        };

        // If user is team leader, only show projects assigned to their team
        if (session.user.role === "PROJECT_MANAGER") {
            const team = await prisma.team.findFirst({
                where: { teamLeadId: session.user.id },
            });
            console.log('PROJECT_MANAGER team:', team);
            // if (team) {
            //     projectQuery.where.teamId = team.id;
            // } else {
            //     return NextResponse.json(
            //         { error: "You are not assigned as a team lead to any team" },
            //         { status: 403 }
            //     );
            // }
        }
        console.log('Project query:', JSON.stringify(projectQuery, null, 2));

        const project = await prisma.project.findUnique(projectQuery);

        if (!project) {
            return NextResponse.json(
                { error: "Project not found" },
                { status: 200 }
            );
        }

        return NextResponse.json({ data: project });
    } catch (error) {
        console.error("Error fetching project:", error);
        return NextResponse.json(
            { error: "Failed to fetch project" },
            { status: 500 }
        );
    }
}
