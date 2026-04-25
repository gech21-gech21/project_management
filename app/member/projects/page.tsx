import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FolderKanban, Users, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";

export default async function MemberProjectsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth");
  }

  if (session.user.role !== "TEAM_MEMBER") {
    redirect("/dashboard");
  }

  // Fetch projects where the user is a member
  const projects = await prisma.project.findMany({
    where: {
      projectMembers: {
        some: {
          userId: session.user.id,
        },
      },
    },
    include: {
      projectManager: {
        select: {
          fullName: true,
          avatarUrl: true,
        },
      },
      _count: {
        select: {
          tasks: {
            where: {
              assignedToId: session.user.id,
            },
          },
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project) => (
            <div 
              key={project.id} 
              className="group bg-white dark:bg-[#0a0a0a] rounded-2xl shadow-sm border border-gray-100 dark:border-[#1a1a1a] overflow-hidden hover:border-blue-500/50 dark:hover:border-blue-400/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/5"
            >
              <div className="p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl transition-transform group-hover:scale-110">
                    <FolderKanban className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.1em] border ${
                    project.status === 'COMPLETED' 
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/10 dark:text-emerald-400 dark:border-emerald-900/20' 
                      : 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/10 dark:text-blue-400 dark:border-blue-900/20'
                  }`}>
                    {project.status.replace('_', ' ')}
                  </span>
                </div>
                
                <h3 className="text-xl font-black text-gray-900 dark:text-gray-100 mb-2 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {project.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-8 h-10 leading-relaxed">
                  {project.description || "No tactical briefing provided for this asset."}
                </p>
                
                <div className="flex items-center gap-4 mb-8">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/5">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-[11px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-tighter">
                      {project._count.tasks} Tasks Assigned
                    </span>
                  </div>
                </div>

                <div className="pt-8 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] font-black text-white border-2 border-white dark:border-[#1a1a1a] shadow-sm">
                      {project.projectManager?.fullName?.[0] || 'U'}
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Commander</p>
                      <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
                        {project.projectManager?.fullName || 'UNASSIGNED'}
                      </p>
                    </div>
                  </div>
                  <Link 
                    href={`/member/projects/${project.id}`}
                    className="p-2 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}

          {projects.length === 0 && (
            <div className="col-span-full py-32 bg-gray-50/50 dark:bg-white/[0.02] rounded-3xl border-2 border-dashed border-gray-100 dark:border-white/5 text-center">
              <div className="w-16 h-16 bg-white dark:bg-[#0a0a0a] rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 flex items-center justify-center mx-auto mb-6">
                <FolderKanban className="w-8 h-8 text-gray-300 dark:text-gray-600" />
              </div>
              <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 uppercase tracking-widest">No Active Assets</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">You haven&apos;t been deployed to any projects yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
