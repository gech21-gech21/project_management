import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function TeamLeaderProjectsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth");
  }

  if (session.user.role !== "TEAMLEADER") {
    redirect("/dashboard");
  }

  const projects = await prisma.project.findMany({
    where: {
      projectManagerId: session.user.id,
    },
    include: {
      _count: {
        select: {
          tasks: true,
          projectMembers: true,
        },
      },
      tasks: {
        where: {
          status: "COMPLETED",
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Projects</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/teamleader/projects/${project.id}`}
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{project.name}</h2>
              {project.code && (
                <p className="text-sm text-gray-500 mb-2">{project.code}</p>
              )}
              <p className="text-gray-600 mb-4 line-clamp-2">
                {project.description || "No description"}
              </p>
              <div className="flex justify-between text-sm text-gray-500">
                <span>{project._count.tasks} tasks</span>
                <span>{project._count.projectMembers} members</span>
              </div>
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}