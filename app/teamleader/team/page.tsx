import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { TeamView } from "./components/team-view";

export default async function TeamLeadersTeamPage() {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
        redirect("/auth/signin");
    }
    
    // Check if user is a team leader
    if (session.user.role !== "TEAMLEADER") {
        redirect("/dashboard");
    }
    
    // Get the team where this user is the team lead
    const team = await prisma.team.findFirst({
        where: {
            teamLeadId: session.user.id
        },
        include: {
            members: {
                include: {
                    user: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                            avatarUrl: true,
                            role: true
                        }
                    }
                }
            },
            department: true
        }
    });
    
    if (!team) {
        return (
            <div className="p-8 text-center">
                <h1 className="text-2xl font-bold text-gray-900">No Team Found</h1>
                <p className="text-gray-600 mt-2">You are not assigned as a team lead for any team.</p>
            </div>
        );
    }
    
    // Get team tasks
    const teamMemberIds = team.members.map(member => member.userId);
    
    const tasks = await prisma.task.findMany({
        where: {
            assignedToId: {
                in: teamMemberIds
            }
        },
        include: {
            project: {
                select: {
                    id: true,
                    name: true,
                    code: true
                }
            },
            assignedTo: {
                select: {
                    id: true,
                    fullName: true,
                    avatarUrl: true
                }
            }
        },
        orderBy: {
            dueDate: 'asc'
        },
        take: 10
    });
    
    // Get team projects
    const projects = await prisma.project.findMany({
        where: {
            projectMembers: {
                some: {
                    userId: {
                        in: teamMemberIds
                    }
                }
            }
        },
        include: {
            projectManager: {
                select: {
                    id: true,
                    fullName: true
                }
            }
        },
        distinct: ['id'],
        take: 5
    });
    
    return (
        <TeamView 
            team={team} 
            tasks={tasks} 
            projects={projects} 
            currentUserId={session.user.id}
        />
    );
}