import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { CheckSquare, Clock, CheckCircle2 } from "lucide-react";

export default async function MemberDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth");
  }

  if (session.user.role !== "TEAM_MEMBER") {
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

  const upcomingDeadlines = tasks
    .filter(t => t.status !== "COMPLETED" && t.dueDate && new Date(t.dueDate) >= new Date())
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Top Spacer - Title is now in Header breadcrumbs */}
      <div className="h-2" />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-[#0a0a0a] border border-gray-100 dark:border-[#1a1a1a] rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">Total Tasks</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-50">{stats.total}</p>
            </div>
            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/10 rounded-xl">
              <CheckSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0a0a0a] border border-gray-100 dark:border-[#1a1a1a] rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">Completed</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.completed}</p>
            </div>
            <div className="p-2.5 bg-green-50 dark:bg-green-900/10 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0a0a0a] border border-gray-100 dark:border-[#1a1a1a] rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">Active</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.inProgress}</p>
            </div>
            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/10 rounded-xl">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0a0a0a] border border-gray-100 dark:border-[#1a1a1a] rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">Pending</p>
              <p className="text-3xl font-bold text-gray-600 dark:text-gray-400">{stats.todo}</p>
            </div>
            <div className="p-2.5 bg-gray-50 dark:bg-gray-900/10 rounded-xl">
              <Clock className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Deadlines */}
      {upcomingDeadlines.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-black text-gray-900 dark:text-gray-100 uppercase tracking-widest flex items-center gap-2">
            <Clock className="w-4 h-4 text-red-500" />
            Upcoming Deadlines
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {upcomingDeadlines.map(task => {
              const daysLeft = Math.ceil((new Date(task.dueDate!).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
              return (
                <Link key={task.id} href={`/member/tasks/${task.id}`} className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl p-4 hover:border-red-300 transition-colors block">
                   <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-2 flex justify-between">
                     {daysLeft} Days Left
                     <span className="text-gray-400 font-mono">{task.project.code}</span>
                   </p>
                   <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{task.title}</p>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Tasks List */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-blue-500" />
          My Task List
        </h2>
        <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl shadow-sm border border-gray-100 dark:border-[#1a1a1a] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 dark:divide-[#1a1a1a]">
              <thead className="bg-gray-50 dark:bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Task Detail</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Project</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Progress</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Criticality</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Deadline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#1a1a1a]">
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <Link href={`/member/tasks/${task.id}`} className="text-sm font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        {task.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{task.project.name}</span>
                        <span className="text-[10px] font-mono text-gray-400 uppercase">{task.project.code}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-[10px] font-bold rounded-full border ${
                        task.status === "COMPLETED" ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/10 dark:text-emerald-400 dark:border-emerald-900/20" :
                        task.status === "IN_PROGRESS" ? "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/10 dark:text-blue-400 dark:border-blue-900/20" :
                        task.status === "REVIEW" ? "bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/10 dark:text-purple-400 dark:border-purple-900/20" :
                        "bg-gray-50 text-gray-600 border-gray-100 dark:bg-white/5 dark:text-gray-400 dark:border-white/10"
                      }`}>
                        {task.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-[10px] font-bold rounded-full ${
                        task.priority === "URGENT" ? "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/10" :
                        task.priority === "HIGH" ? "text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/10" :
                        task.priority === "MEDIUM" ? "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/10" :
                        "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/10"
                      }`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-mono tracking-tighter">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "TBD"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
