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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Tasks</h1>
          <p className="mt-2 text-gray-600">
            View and manage all tasks assigned to you
          </p>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* TODO Column */}
          <div className="bg-gray-100/50 rounded-xl p-4 border border-gray-200">
            <h2 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              To Do ({groupedTasks.TODO.length})
            </h2>
            <div className="space-y-3">
              {groupedTasks.TODO.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
              {groupedTasks.TODO.length === 0 && (
                <EmptyState message="No tasks to do" />
              )}
            </div>
          </div>

          {/* IN PROGRESS Column */}
          <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
            <h2 className="font-semibold text-blue-700 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              In Progress ({groupedTasks.IN_PROGRESS.length})
            </h2>
            <div className="space-y-3">
              {groupedTasks.IN_PROGRESS.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
              {groupedTasks.IN_PROGRESS.length === 0 && (
                <EmptyState message="No tasks in progress" />
              )}
            </div>
          </div>

          {/* REVIEW Column */}
          <div className="bg-purple-50/50 rounded-xl p-4 border border-purple-100">
            <h2 className="font-semibold text-purple-700 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              Review ({groupedTasks.REVIEW.length})
            </h2>
            <div className="space-y-3">
              {groupedTasks.REVIEW.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
              {groupedTasks.REVIEW.length === 0 && (
                <EmptyState message="No tasks in review" />
              )}
            </div>
          </div>

          {/* COMPLETED Column */}
          <div className="bg-green-50/50 rounded-xl p-4 border border-green-100">
            <h2 className="font-semibold text-green-700 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Completed ({groupedTasks.COMPLETED.length})
            </h2>
            <div className="space-y-3">
              {groupedTasks.COMPLETED.map((task) => (
                <TaskCard key={task.id} task={task} isCompleted />
              ))}
              {groupedTasks.COMPLETED.length === 0 && (
                <EmptyState message="No completed tasks" />
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
      case "URGENT": return "bg-red-100 text-red-800";
      case "HIGH": return "bg-orange-100 text-orange-800";
      case "MEDIUM": return "bg-yellow-100 text-yellow-800";
      case "LOW": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
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
      className="block bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-all border border-gray-200 group"
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className={`font-medium text-gray-900 group-hover:text-blue-600 transition-colors ${isCompleted ? 'line-through text-gray-400' : ''}`}>
          {task.title}
        </h3>
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${getPriorityColor(task.priority)}`}>
          {task.priority}
        </span>
      </div>
      
      <p className="text-xs text-gray-500 mb-3">
        {task.project.name}
      </p>
      
      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-3">
          {task.dueDate && (
            <div className="flex items-center text-[10px] text-gray-500 font-medium bg-gray-50 px-1.5 py-0.5 rounded ring-1 ring-inset ring-gray-200">
              <Calendar className="w-3 h-3 mr-1 text-gray-400" />
              {formatDate(task.dueDate)}
            </div>
          )}
        </div>
        <div className="flex items-center text-gray-400">
          <MessageSquare className="w-3 h-3 mr-1" />
          <span className="text-[10px]">{task._count.comments}</span>
        </div>
      </div>
    </Link>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-lg">
      <p className="text-xs text-gray-400 font-medium">{message}</p>
    </div>
  );
}
