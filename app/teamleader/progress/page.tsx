import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BarChart3, TrendingUp, CheckCircle2, Clock } from "lucide-react";

export default async function TeamLeaderProgressPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth");
  }

  if (session.user.role !== "TEAMLEADER") {
    redirect("/dashboard");
  }

  // Fetch projects managed by this team leader
  const projects = await prisma.project.findMany({
    where: {
      projectManagerId: session.user.id,
    },
    include: {
      tasks: {
        select: {
          status: true,
        },
      },
      _count: {
        select: {
          tasks: true,
        },
      },
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Project Progress</h1>
          <p className="mt-2 text-gray-600">Track implementation progress across your projects</p>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {projects.map((project) => {
            const totalTasks = project.tasks.length;
            const completedTasks = project.tasks.filter(t => t.status === 'COMPLETED').length;
            const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

            return (
              <div key={project.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">{project.name}</h2>
                    <p className="text-sm text-gray-500">Project Progress Overview</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-2xl font-black text-blue-600">{progress}%</p>
                      <p className="text-[10px] uppercase font-bold text-gray-400">Overall Completion</p>
                    </div>
                    <div className="w-16 h-16 rounded-full border-4 border-blue-50 flex items-center justify-center relative">
                      <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent" style={{ transform: `rotate(${progress * 3.6}deg)` }}></div>
                      <TrendingUp className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Completed</p>
                      <p className="text-lg font-bold text-gray-900">{completedTasks} / {totalTasks}</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center">
                      <Clock className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">In Progress</p>
                      <p className="text-lg font-bold text-gray-900">
                        {project.tasks.filter(t => t.status === 'IN_PROGRESS').length}
                      </p>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Remaining</p>
                      <p className="text-lg font-bold text-gray-900">
                        {totalTasks - completedTasks}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 rounded-full transition-all duration-1000"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            );
          })}

          {projects.length === 0 && (
            <div className="py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200 text-center">
              <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900">No projects to track</h3>
              <p className="text-gray-500">Start by creating or being assigned to a project.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
