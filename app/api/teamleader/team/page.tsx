import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export default async function TeamLeaderTeamPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth");
  }

  if (session.user.role !== "TEAMLEADER") {
    redirect("/dashboard");
  }

  const team = await prisma.team.findFirst({
    where: {
      teamLeadId: session.user.id,
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
              role: true,
            },
          },
        },
      },
      department: true,
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Team</h1>
        
        {team ? (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">{team.name}</h2>
            {team.description && (
              <p className="text-gray-600 mb-4">{team.description}</p>
            )}
            {team.department && (
              <p className="text-sm text-gray-500 mb-6">Department: {team.department.name}</p>
            )}
            
            <h3 className="text-lg font-medium text-gray-900 mb-4">Team Members ({team.members.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {team.members.map((member) => (
                <div key={member.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-medium">
                      {member.user.fullName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{member.user.fullName}</p>
                    <p className="text-sm text-gray-500">{member.user.email}</p>
                    <p className="text-xs text-gray-400">Role: {member.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-gray-600">You are not assigned to any team yet.</p>
        )}
      </div>
    </div>
  );
}