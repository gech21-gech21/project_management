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

  if (session.user.role !== "MEMBER" && session.user.role !== "USER") {
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Projects</h1>
          <p className="mt-2 text-gray-600">
            View all projects you are collaborating on
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <FolderKanban className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    project.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {project.status.replace('_', ' ')}
                  </span>
                </div>
                
                <h3 className="text-lg font-bold text-gray-900 mb-2">{project.name}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 mb-6 h-10">
                  {project.description || "No description provided."}
                </p>
                
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-semibold text-gray-600">
                      {project._count.tasks} My Tasks
                    </span>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500">
                      {project.projectManager?.fullName?.[0] || 'U'}
                    </div>
                    <span className="text-xs text-gray-500">
                      Manager: {project.projectManager?.fullName || 'Unassigned'}
                    </span>
                  </div>
                  <Link 
                    href={`/member/projects/${project.id}`}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}

          {projects.length === 0 && (
            <div className="col-span-full py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200 text-center">
              <FolderKanban className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900">No projects yet</h3>
              <p className="text-gray-500">You haven't been assigned to any projects.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
