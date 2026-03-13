import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { CheckSquare, Clock, CheckCircle2 } from "lucide-react";

export default async function MemberDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth");
  }

  if (session.user.role !== "MEMBER" && session.user.role !== "USER") {
    redirect("/dashboard");
  }

  // Fetch tasks assigned to this member
  const tasks = await prisma.task.findMany({
    where: {
      assignedToId: session.user.id,
    },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
    },
    orderBy: {
      dueDate: "asc",
    },
  });

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === "COMPLETED").length,
    inProgress: tasks.filter(t => t.status === "IN_PROGRESS").length,
    todo: tasks.filter(t => t.status === "TODO").length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Member Dashboard</h1>
        <p className="text-gray-600 mb-8">Track your tasks and projects.</p>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Tasks</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <CheckSquare className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">To Do</p>
                <p className="text-2xl font-bold text-gray-600">{stats.todo}</p>
              </div>
              <Clock className="w-8 h-8 text-gray-500" />
            </div>
          </div>
        </div>

        {/* Tasks List */}
        <h2 className="text-xl font-semibold text-gray-900 mb-4">My Tasks</h2>
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tasks.map((task) => (
                <tr key={task.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Link href={`/member/tasks/${task.id}`} className="text-blue-600 hover:text-blue-800">
                      {task.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4">{task.project.name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      task.status === "COMPLETED" ? "bg-green-100 text-green-800" :
                      task.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-800" :
                      task.status === "REVIEW" ? "bg-yellow-100 text-yellow-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {task.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      task.priority === "URGENT" ? "bg-red-100 text-red-800" :
                      task.priority === "HIGH" ? "bg-orange-100 text-orange-800" :
                      task.priority === "MEDIUM" ? "bg-yellow-100 text-yellow-800" :
                      "bg-blue-100 text-blue-800"
                    }`}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No date"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}