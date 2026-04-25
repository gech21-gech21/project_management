import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Calendar, User, MessageSquare, Plus, CheckCircle2, XCircle, ShieldAlert } from "lucide-react";
import { CreateTaskButton } from "./components/create-task-button";
import { QCApprovalButtons } from "./components/qc-approval-buttons";

export default async function PROJECT_MANAGERTasksPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth");
  }

  if (session.user.role !== "PROJECT_MANAGER") {
    redirect("/dashboard");
  }

  // Fetch all tasks from projects managed by this team leader
  const tasks = await prisma.task.findMany({
    where: {
      project: {
        projectManagerId: session.user.id,
      },
    },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      assignedTo: {
        select: {
          id: true,
          fullName: true,
          email: true,
          avatarUrl: true,
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

  // Fetch projects for the create task form
  const projects = await prisma.project.findMany({
    where: {
      projectManagerId: session.user.id,
    },
    select: {
      id: true,
      name: true,
      code: true,
    },
  });

  // Fetch team members (users in the team lead's team)
  const team = await prisma.team.findFirst({
    where: {
      teamLeadId: session.user.id
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              avatarUrl: true,
            }
          }
        }
      }
    }
  });

  const teamMembers = team?.members.map(member => member.user) || [];

  // Group tasks by status
  const groupedTasks = {
    TODO: tasks.filter(t => t.status === "TODO"),
    IN_PROGRESS: tasks.filter(t => t.status === "IN_PROGRESS"),
    REVIEW: tasks.filter(t => t.status === "REVIEW"),
    COMPLETED: tasks.filter(t => t.status === "COMPLETED"),
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "TODO":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "REVIEW":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "COMPLETED":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

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
        {/* Header with Create Button */}
        <div className="mb-12 flex justify-between items-center">
          <div>
            <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.3em] mb-1">Mission Control</p>
            <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tighter uppercase">Operational Flow</h2>
          </div>
          <CreateTaskButton 
            projects={projects} 
            teamMembers={teamMembers}
            teamLeadId={session.user.id}
          />
        </div>

        {/* Task Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Backlog', count: groupedTasks.TODO.length, color: 'text-gray-400', border: 'border-gray-200' },
            { label: 'In Flight', count: groupedTasks.IN_PROGRESS.length, color: 'text-blue-500', border: 'border-blue-400' },
            { label: 'In Audit', count: groupedTasks.REVIEW.length, color: 'text-amber-500', border: 'border-amber-400' },
            { label: 'Deployed', count: groupedTasks.COMPLETED.length, color: 'text-emerald-500', border: 'border-emerald-400' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white dark:bg-[#0a0a0a] rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-[#1a1a1a] group hover:shadow-xl transition-all">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                  <p className="text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tighter">{stat.count}</p>
                </div>
                <div className={`w-1 h-8 rounded-full ${stat.border.replace('border-', 'bg-')} opacity-30 group-hover:opacity-100 transition-opacity`}></div>
              </div>
            </div>
          ))}
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* TODO Column */}
          <div className="bg-gray-50/50 dark:bg-white/[0.02] rounded-2xl p-5 border border-gray-100 dark:border-white/5">
            <h2 className="text-[11px] font-black text-gray-400 dark:text-gray-500 mb-6 flex items-center gap-2 uppercase tracking-[0.2em]">
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full shadow-[0_0_8px_rgba(156,163,175,0.4)]"></div>
              Backlog ({groupedTasks.TODO.length})
            </h2>
            <div className="space-y-4">
              {groupedTasks.TODO.map((task) => (
                <TaskCard key={task.id} task={task} getPriorityColor={getPriorityColor} formatDate={formatDate} />
              ))}
              {groupedTasks.TODO.length === 0 && (
                <div className="text-center py-10 opacity-30">
                  <p className="text-[10px] font-black uppercase">Clear Sky</p>
                </div>
              )}
            </div>
          </div>

          {/* IN PROGRESS Column */}
          <div className="bg-blue-50/30 dark:bg-blue-500/[0.02] rounded-2xl p-5 border border-blue-100/50 dark:border-blue-500/10">
            <h2 className="text-[11px] font-black text-blue-600 dark:text-blue-400 mb-6 flex items-center gap-2 uppercase tracking-[0.2em]">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)] animate-pulse"></div>
              Active Procs ({groupedTasks.IN_PROGRESS.length})
            </h2>
            <div className="space-y-4">
              {groupedTasks.IN_PROGRESS.map((task) => (
                <TaskCard key={task.id} task={task} getPriorityColor={getPriorityColor} formatDate={formatDate} />
              ))}
              {groupedTasks.IN_PROGRESS.length === 0 && (
                <div className="text-center py-10 opacity-30">
                  <p className="text-[10px] font-black uppercase">Idle State</p>
                </div>
              )}
            </div>
          </div>

          {/* REVIEW Column — PM Quality Control */}
          <div className="bg-amber-50/30 dark:bg-amber-500/[0.02] rounded-2xl p-5 border border-amber-100/50 dark:border-amber-500/10">
            <h2 className="text-[11px] font-black text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-2 uppercase tracking-[0.2em]">
              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.6)]"></div>
              Audit Stage ({groupedTasks.REVIEW.length})
            </h2>
            <p className="text-[9px] text-amber-500/70 dark:text-amber-400/50 font-bold uppercase tracking-wider mb-5">Approve or reject below</p>
            <div className="space-y-4">
              {groupedTasks.REVIEW.map((task) => (
                <div key={task.id} className="block bg-white dark:bg-[#0a0a0a] rounded-xl shadow-sm p-4 border border-amber-200 dark:border-amber-500/20 transition-all duration-300 group">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-200 leading-tight flex-1 pr-2">{task.title}</h3>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-wider border ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                  <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">{task.project.name}</p>
                  {task.assignedTo && (
                    <p className="text-[10px] text-gray-400 mb-3">👤 {task.assignedTo.fullName}</p>
                  )}
                  <QCApprovalButtons taskId={task.id} assignedToName={task.assignedTo?.fullName} />
                </div>
              ))}
              {groupedTasks.REVIEW.length === 0 && (
                <div className="text-center py-10 opacity-30">
                  <p className="text-[10px] font-black uppercase">Final Check Clear</p>
                </div>
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
                <TaskCard key={task.id} task={task} isCompleted getPriorityColor={getPriorityColor} formatDate={formatDate} />
              ))}
              {groupedTasks.COMPLETED.length === 0 && (
                <div className="text-center py-10 opacity-30">
                  <p className="text-[10px] font-black uppercase">No History Record</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskCard({ task, isCompleted = false, getPriorityColor, formatDate }: { task: any, isCompleted?: boolean, getPriorityColor: any, formatDate: any }) {
  return (
    <Link
      href={`/manager/tasks/${task.id}`}
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
