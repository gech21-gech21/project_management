import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { FolderKanban, Users, Activity, CheckSquare, ArrowRight, Shield } from "lucide-react";

export default async function PROJECT_MANAGERProjectsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth");
  }

  if (session.user.role !== "PROJECT_MANAGER") {
    redirect("/dashboard");
  }

  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { projectManagerId: session.user.id },
        { team: { teamLeadId: session.user.id } }
      ]
    },
    include: {
      team: true,
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

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/manager/projects/${project.id}`}
              className="group bg-white dark:bg-[#0a0a0a] p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-[#1a1a1a] hover:border-blue-500/50 dark:hover:border-blue-400/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/5 overflow-hidden relative"
            >
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 transition-transform group-hover:scale-110">
                    <FolderKanban className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className={`px-3 py-1 rounded-md text-xs font-black uppercase tracking-wider border ${
                    project.status === "COMPLETED" 
                      ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" 
                      : "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20"
                  }`}>
                    {project.status}
                  </span>
                </div>

                <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100 mb-2 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {project.name}
                </h2>
                
                {project.code && (
                  <p className="text-[10px] font-mono text-gray-400 uppercase tracking-tighter mb-4">{project.code}</p>
                )}
                
                <p className="text-base text-gray-500 dark:text-gray-400 mb-8 line-clamp-2 leading-relaxed h-12">
                  {project.description || "System asset awaiting classification."}
                </p>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/5">
                    <CheckSquare className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-tighter">
                      {project._count.tasks} Tasks
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/5">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-tighter">
                      {project._count.projectMembers} Active
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest">
                    <span className="text-gray-400">Momentum</span>
                    <span className="text-blue-600 dark:text-blue-400 font-mono italic text-sm">{project.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-50 dark:bg-white/5 rounded-full h-1.5 overflow-hidden border border-gray-100 dark:border-white/5">
                    <div
                      className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(37,99,235,0.3)]"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Decorative Background Element */}
              <div className="absolute -bottom-4 -right-4 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-500">
                <FolderKanban size={140} />
              </div>
            </Link>
          ))}

          {projects.length === 0 && (
            <div className="col-span-full py-32 bg-gray-50/50 dark:bg-white/[0.02] rounded-3xl border-2 border-dashed border-gray-100 dark:border-white/5 text-center">
              <div className="w-16 h-16 bg-white dark:bg-[#0a0a0a] rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 flex items-center justify-center mx-auto mb-6">
                <FolderKanban className="w-8 h-8 text-gray-300 dark:text-gray-600" />
              </div>
              <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 uppercase tracking-widest">No Projects Registered</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Begin deployment by creating your first tactical project.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
