import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Users, Mail, UserCircle, Shield } from "lucide-react";

export default async function MemberTeamPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth");
  }

  if (session.user.role !== "TEAM_MEMBER") {
    redirect("/dashboard");
  }

  // Fetch the team the user belongs to
  const teamMember = await prisma.teamMember.findFirst({
    where: {
      userId: session.user.id,
    },
    include: {
      team: {
        include: {
          teamLead: {
            select: {
              fullName: true,
              email: true,
              avatarUrl: true,
            },
          },
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
        },
      },
    },
  });

  if (!teamMember) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Not in a Team</h2>
          <p className="text-gray-600">You haven&apos;t been assigned to any team yet. Please contact your administrator.</p>
        </div>
      </div>
    );
  }

  const team = teamMember.team;

  return (
    <div className="">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{team.name}</h1>
          <p className="mt-2 text-gray-600">Meet your teammates and leads</p>
        </div>

        {/* Team Leader */}
        <section className="mb-12">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Team Leader
          </h2>
          {team.teamLead ? (
            <div className="max-w-sm bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
                {team.teamLead.fullName[0]}
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{team.teamLead.fullName}</h3>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {team.teamLead.email}
                </p>
              </div>
            </div>
          ) : (
            <div className="max-w-sm bg-gray-50 rounded-2xl border border-dashed border-gray-300 p-6 flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                <UserCircle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-bold text-gray-500 text-sm">No Team Lead Assigned</h3>
                <p className="text-xs text-gray-400">Contact admin to assign a lead</p>
              </div>
            </div>
          )}
        </section>

        {/* Members */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-400" />
            Team Members ({team.members.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.members.map((member) => (
              <div key={member.user.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-center group hover:border-blue-200 transition-colors">
                <div className="w-20 h-20 rounded-full bg-gray-50 mx-auto mb-4 flex items-center justify-center text-2xl font-bold text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                  {member.user.fullName[0]}
                </div>
                <h3 className="font-bold text-gray-900 mb-1">{member.user.fullName}</h3>
                <p className="text-xs text-gray-500 mb-4">{member.user.email}</p>
                <div className="pt-4 border-t border-gray-50 flex items-center justify-center gap-2">
                  <span className="px-2 py-1 rounded-full bg-gray-100 text-[10px] font-bold text-gray-600">
                    {member.user.role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
