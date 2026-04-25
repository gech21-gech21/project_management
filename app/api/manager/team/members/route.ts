// app/api/manager/team/members/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userRole = session.user.role;
        if (!["ADMIN", "PROJECT_MANAGER"].includes(userRole)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        const { searchParams } = new URL(request.url);
        const projectId = searchParams.get("projectId");
        if (userRole === "PROJECT_MANAGER") {
            if (projectId) {
                // Verify project exists and user has access
                const project = await prisma.project.findUnique({
                    where: { id: projectId },
                    select: { 
                        teamId: true,
                        projectManagerId: true,
                    }
                });

                if (!project) {
                    return NextResponse.json({ error: "Project not found" }, { status: 404 });
                }

                // Check if they are project manager
                let hasAccess = project.projectManagerId === session.user.id;

                // OR check if they are team lead of the project's team
                if (!hasAccess && project.teamId) {
                    const team = await prisma.team.findFirst({
                        where: { 
                            id: project.teamId,
                            teamLeadId: session.user.id 
                        },
                    });
                    if (team) hasAccess = true;
                }

                if (!hasAccess) {
                    return NextResponse.json({ error: "Access denied" }, { status: 403 });
                }

                if (project.teamId) {
                    const teamMembers = await prisma.teamMember.findMany({
                        where: { teamId: project.teamId },
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    fullName: true,
                                    email: true,
                                    role: true,
                                    avatarUrl: true,
                                },
                            },
                        },
                    });
                    return NextResponse.json({ data: teamMembers.map(tm => tm.user).filter(Boolean) });
                } else {
                    return NextResponse.json({ data: [] });
                }
            }

            // Fallback: Get all teams associated with projects managed by this user
            const managedProjects = await prisma.project.findMany({
                where: { projectManagerId: session.user.id },
                select: { teamId: true }
            });
            
            const teamIds = new Set<string>();
            managedProjects.forEach(p => {
                if (p.teamId) teamIds.add(p.teamId);
            });
            
            // Get ALL teams they lead
            const ledTeams = await prisma.team.findMany({
                where: { teamLeadId: session.user.id },
                select: { id: true }
            });
            ledTeams.forEach(t => teamIds.add(t.id));

            const teamMembers = await prisma.teamMember.findMany({
                where: {
                    teamId: { in: Array.from(teamIds) }
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                            role: true,
                            avatarUrl: true,
                        },
                    },
                },
            });

            // Make unique by user ID
            const usersMap = new Map();
            teamMembers.forEach(tm => {
                if (tm.user) usersMap.set(tm.user.id, tm.user);
            });

            return NextResponse.json({ data: Array.from(usersMap.values()) });
        }
        if (userRole === "ADMIN") {
            if (projectId) {
                const project = await prisma.project.findUnique({
                    where: { id: projectId },
                    select: { teamId: true }
                });
                if (project?.teamId) {
                    const team = await prisma.team.findUnique({
                        where: { id: project.teamId },
                        include: {
                            members: {
                                include: {
                                    user: {
                                        select: {
                                            id: true,
                                            fullName: true,
                                            email: true,
                                            role: true,
                                        },
                                    },
                                },
                            },
                        },
                    });
                    if (team) {
                        return NextResponse.json({ data: team.members.map((tm: any) => tm.user) });
                    }
                }
            }
            const users = await prisma.user.findMany({
                where: {
                    role: { in: ["TEAM_MEMBER", "PROJECT_MANAGER"] },
                },
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    role: true,
                },
                orderBy: { fullName: "asc" },
            });
            return NextResponse.json({ data: users });
        }
        return NextResponse.json({ data: [] });
    } catch (error) {
        console.error("Error fetching team members:", error);
        return NextResponse.json({ error: "Failed to fetch team members" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== "PROJECT_MANAGER") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const body = await request.json();
        const { userId, role } = body;
        if (!userId) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }
        const team = await prisma.team.findFirst({
            where: { teamLeadId: session.user.id }
        });
        if (!team) {
            return NextResponse.json({ error: "Team not found" }, { status: 404 });
        }
        const existingMember = await prisma.teamMember.findFirst({
            where: {
                teamId: team.id,
                userId: userId
            }
        });
        if (existingMember) {
            return NextResponse.json({ error: "User is already a member of your team" }, { status: 400 });
        }
        const member = await prisma.teamMember.create({
            data: {
                teamId: team.id,
                userId: userId,
                role: role || "MEMBER"
            },
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        role: true
                    }
                }
            }
        });
        return NextResponse.json({ data: member }, { status: 201 });
    } catch (error) {
        console.error("Error adding team member:", error);
        return NextResponse.json({ error: "Failed to add team member" }, { status: 500 });
    }
}
