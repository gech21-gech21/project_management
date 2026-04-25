import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Calendar, User, MessageSquare, Clock, CheckCircle2, AlertCircle } from "lucide-react";

export default async function MemberTasksPage() {
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
      _count: {
        select: {
          comments: true,
        },
      },
    },
    orderBy: [
      {
        status: 'asc',
      },
      {
        dueDate: 'asc',
      },
    ],
  });

  // Group tasks by status
  const groupedTasks = {
    TODO: tasks.filter(t => t.status === "TODO"),
    IN_PROGRESS: tasks.filter(t => t.status === "IN_PROGRESS"),
    REVIEW: tasks.filter(t => t.status === "REVIEW"),
    COMPLETED: tasks.filter(t => t.status === "COMPLETED"),
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "bg-red-100 text-red-800";
      case "HIGH":
        return "bg-orange-100 text-orange-800";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800";
      case "LOW":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "No due date";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* TODO Column */}
          <div className="bg-gray-50/50 dark:bg-white/[0.02] rounded-2xl p-5 border border-gray-100 dark:border-white/5">
            <h2 className="text-[11px] font-black text-gray-400 dark:text-gray-500 mb-6 flex items-center gap-2 uppercase tracking-[0.2em]">
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full shadow-[0_0_8px_rgba(156,163,175,0.4)]"></div>
              Awaiting Action ({groupedTasks.TODO.length})
            </h2>
            <div className="space-y-4">
              {groupedTasks.TODO.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
              {groupedTasks.TODO.length === 0 && (
                <EmptyState message="No tasks in queue" icon="A" />
              )}
            </div>
          </div>

          {/* IN PROGRESS Column */}
          <div className="bg-blue-50/30 dark:bg-blue-500/[0.02] rounded-2xl p-5 border border-blue-100/50 dark:border-blue-500/10">
            <h2 className="text-[11px] font-black text-blue-600 dark:text-blue-400 mb-6 flex items-center gap-2 uppercase tracking-[0.2em]">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)] animate-pulse"></div>
              Active Sync ({groupedTasks.IN_PROGRESS.length})
            </h2>
            <div className="space-y-4">
              {groupedTasks.IN_PROGRESS.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
              {groupedTasks.IN_PROGRESS.length === 0 && (
                <EmptyState message="No active operations" icon="S" />
              )}
            </div>
          </div>

          {/* REVIEW Column */}
          <div className="bg-purple-50/30 dark:bg-purple-500/[0.02] rounded-2xl p-5 border border-purple-100/50 dark:border-purple-500/10">
            <h2 className="text-[11px] font-black text-purple-600 dark:text-purple-400 mb-6 flex items-center gap-2 uppercase tracking-[0.2em]">
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.6)]"></div>
              Quality Audit ({groupedTasks.REVIEW.length})
            </h2>
            <div className="space-y-4">
              {groupedTasks.REVIEW.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
              {groupedTasks.REVIEW.length === 0 && (
                <EmptyState message="Clean manifest" icon="Q" />
              )}
            </div>
          </div>

          {/* COMPLETED Column */}
          <div className="bg-emerald-50/30 dark:bg-emerald-500/[0.02] rounded-2xl p-5 border border-emerald-100/50 dark:border-emerald-500/10">
            <h2 className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 mb-6 flex items-center gap-2 uppercase tracking-[0.2em]">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
              Archived ({groupedTasks.COMPLETED.length})
            </h2>
            <div className="space-y-4">
              {groupedTasks.COMPLETED.map((task) => (
                <TaskCard key={task.id} task={task} isCompleted />
              ))}
              {groupedTasks.COMPLETED.length === 0 && (
                <EmptyState message="No archived tasks" icon="Z" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskCard({ task, isCompleted = false }: { task: any, isCompleted?: boolean }) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT": return "bg-red-50 text-red-600 border-red-100 dark:bg-red-900/10 dark:text-red-400 dark:border-red-900/20";
      case "HIGH": return "bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-900/10 dark:text-orange-400 dark:border-orange-900/20";
      case "MEDIUM": return "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/10 dark:text-amber-400 dark:border-amber-900/20";
      case "LOW": return "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/10 dark:text-blue-400 dark:border-blue-900/20";
      default: return "bg-gray-50 text-gray-600 border-gray-100 dark:bg-white/5 dark:text-gray-400 dark:border-white/10";
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString("en-US", {
      month: "short", day: "numeric"
    });
  };

  return (
    <Link
      href={`/member/tasks/${task.id}`}
      className="block bg-white dark:bg-[#0a0a0a] rounded-xl shadow-sm p-4 border border-gray-100 dark:border-[#1a1a1a] hover:border-blue-500/50 dark:hover:border-blue-400/50 transition-all duration-300 group hover:shadow-lg hover:shadow-blue-500/5"
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className={`text-sm font-bold text-gray-900 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight ${isCompleted ? 'line-through opacity-50' : ''}`}>
          {task.title}
        </h3>
        <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-wider border ${getPriorityColor(task.priority)}`}>
          {task.priority}
        </span>
      </div>
      
      <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">
        {task.project.name}
      </p>
      
      <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50 dark:border-white/5">
        <div className="flex items-center gap-3">
          {task.dueDate && (
            <div className="flex items-center text-[10px] text-gray-500 dark:text-gray-400 font-mono italic">
              <Calendar className="w-3.5 h-3.5 mr-1.5 opacity-40" />
              {formatDate(task.dueDate)}
            </div>
          )}
        </div>
        <div className="flex items-center text-gray-400 dark:text-gray-600">
          <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
          <span className="text-[10px] font-bold">{task._count.comments}</span>
        </div>
      </div>
    </Link>
  );
}

function EmptyState({ message, icon }: { message: string, icon: string }) {
  return (
    <div className="text-center py-10 border-2 border-dashed border-gray-100 dark:border-white/5 rounded-2xl bg-gray-50/30 dark:bg-white/[0.01]">
      <div className="w-10 h-10 bg-white dark:bg-[#0a0a0a] rounded-xl shadow-sm border border-gray-100 dark:border-white/5 flex items-center justify-center mx-auto mb-4 text-[10px] font-black text-gray-300 dark:text-gray-600">
        {icon}
      </div>
      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{message}</p>
    </div>
  );
}
