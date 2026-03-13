// app/api/teamleader/team/members/route.ts
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

        if (!["ADMIN", "TEAMLEADER"].includes(session.user.role)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // For team leaders, get members of their team
        if (session.user.role === "TEAMLEADER") {
            const team = await prisma.team.findFirst({
                where: { teamLeadId: session.user.id },
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
            if (!team) {
                return NextResponse.json({ data: [] });
            }
            const members = team.members.map((tm: any) => tm.user);
            return NextResponse.json({ data: members });
        }

        // For admins, get all users
        const users = await prisma.user.findMany({
            where: {
                role: {
                    in: ["USER", "TEAMLEADER"],
                },
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
            },
            orderBy: {
                fullName: "asc",
            },
        });

        return NextResponse.json({ data: users });
    } catch (error) {
        console.error("Error fetching team members:", error);
        return NextResponse.json(
            { error: "Failed to fetch team members" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || session.user.role !== "TEAMLEADER") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { userId, role } = body;

        if (!userId) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        // Find the team where this user is the lead
        const team = await prisma.team.findFirst({
            where: { teamLeadId: session.user.id }
        });

        if (!team) {
            return NextResponse.json({ error: "Team not found" }, { status: 404 });
        }

        // Check if user is already a member
        const existingMember = await prisma.teamMember.findFirst({
            where: {
                teamId: team.id,
                userId: userId
            }
        });

        if (existingMember) {
            return NextResponse.json({ error: "User is already a member of your team" }, { status: 400 });
        }

        // Add the member
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
        return NextResponse.json(
            { error: "Failed to add team member" },
            { status: 500 }
        );
    }
}