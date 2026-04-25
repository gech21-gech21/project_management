"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  FolderKanban,
  ShieldAlert,
  Calendar,
  Users,
  FileText,
  Download,
} from "lucide-react";

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  isBlocked: boolean;
  blockerReason: string | null;
  assignedTo: { id: string; fullName: string; avatarUrl: string | null } | null;
  project: { id: string; name: string };
}

interface Milestone {
  id: string;
  name: string;
  status: string;
  dueDate: string | null;
}

interface Project {
  id: string;
  name: string;
  status: string;
  progress: number;
  tasks: Task[];
  milestones: Milestone[];
  _count: { tasks: number; projectMembers: number };
}

interface Stats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalTasks: number;
  todoTasks: number;
  inProgressTasks: number;
  reviewTasks: number;
  completedTasks: number;
  blockedTasks: number;
  totalMilestones: number;
  completedMilestones: number;
}

interface Props {
  projects: Project[];
  stats: Stats;
  overdueTasks: Task[];
  blockedTasks: Task[];
}

const PRIORITY_COLOR: Record<string, string> = {
  URGENT: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400",
  HIGH: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400",
  MEDIUM: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400",
  LOW: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400",
};

export function ReportsClient({ projects, stats, overdueTasks, blockedTasks }: Props) {
  const [activeTab, setActiveTab] = useState<"overview" | "projects" | "risks">("overview");

  const completionRate = stats.totalTasks > 0
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
    : 0;

  const milestoneRate = stats.totalMilestones > 0
    ? Math.round((stats.completedMilestones / stats.totalMilestones) * 100)
    : 0;

  const statCards = [
    {
      label: "Total Projects",
      value: stats.totalProjects,
      sub: `${stats.activeProjects} active · ${stats.completedProjects} done`,
      icon: FolderKanban,
      color: "from-blue-500 to-indigo-600",
      bg: "bg-blue-50 dark:bg-blue-900/10",
      text: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Overall Completion",
      value: `${completionRate}%`,
      sub: `${stats.completedTasks} of ${stats.totalTasks} tasks done`,
      icon: TrendingUp,
      color: "from-emerald-500 to-teal-600",
      bg: "bg-emerald-50 dark:bg-emerald-900/10",
      text: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Pending Review",
      value: stats.reviewTasks,
      sub: "Tasks awaiting PM approval",
      icon: Clock,
      color: "from-amber-500 to-orange-600",
      bg: "bg-amber-50 dark:bg-amber-900/10",
      text: "text-amber-600 dark:text-amber-400",
    },
    {
      label: "Active Risks",
      value: blockedTasks.length + overdueTasks.length,
      sub: `${blockedTasks.length} blocked · ${overdueTasks.length} overdue`,
      icon: ShieldAlert,
      color: "from-rose-500 to-red-600",
      bg: "bg-rose-50 dark:bg-rose-900/10",
      text: "text-rose-600 dark:text-rose-400",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#080808]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.3em] mb-1">
              Project Manager
            </p>
            <h1 className="text-3xl font-black text-gray-900 dark:text-gray-50 tracking-tight">
              Status Reports
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Comprehensive overview of all projects, tasks, and risks
            </p>
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-all shadow-sm"
          >
            <Download size={15} />
            Export Report
          </button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-gray-100 dark:border-[#1a1a1a] p-6 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-2.5 rounded-xl ${card.bg}`}>
                  <card.icon className={`w-5 h-5 ${card.text}`} />
                </div>
              </div>
              <p className="text-3xl font-black text-gray-900 dark:text-gray-50 mb-1">
                {card.value}
              </p>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                {card.label}
              </p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500">{card.sub}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-[#111] rounded-xl mb-8 w-fit">
          {(["overview", "projects", "risks"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === tab
                  ? "bg-white dark:bg-[#222] text-gray-900 dark:text-gray-100 shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Task Status Distribution */}
            <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-gray-100 dark:border-[#1a1a1a] p-6 shadow-sm">
              <h2 className="text-sm font-black text-gray-900 dark:text-gray-100 uppercase tracking-wider mb-6 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-500" />
                Task Status Distribution
              </h2>
              <div className="space-y-4">
                {[
                  { label: "To Do", count: stats.todoTasks, color: "bg-gray-400", pct: stats.totalTasks > 0 ? (stats.todoTasks / stats.totalTasks) * 100 : 0 },
                  { label: "In Progress", count: stats.inProgressTasks, color: "bg-blue-500", pct: stats.totalTasks > 0 ? (stats.inProgressTasks / stats.totalTasks) * 100 : 0 },
                  { label: "Under Review", count: stats.reviewTasks, color: "bg-amber-500", pct: stats.totalTasks > 0 ? (stats.reviewTasks / stats.totalTasks) * 100 : 0 },
                  { label: "Completed", count: stats.completedTasks, color: "bg-emerald-500", pct: stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0 },
                ].map((row) => (
                  <div key={row.label} className="flex items-center gap-4">
                    <span className="w-28 text-xs font-bold text-gray-600 dark:text-gray-400 shrink-0">{row.label}</span>
                    <div className="flex-1 h-2.5 bg-gray-100 dark:bg-[#1a1a1a] rounded-full overflow-hidden">
                      <div
                        className={`h-full ${row.color} rounded-full transition-all duration-700`}
                        style={{ width: `${row.pct}%` }}
                      />
                    </div>
                    <span className="w-8 text-xs font-black text-gray-900 dark:text-gray-100 text-right shrink-0">
                      {row.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Milestone Progress */}
            <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-gray-100 dark:border-[#1a1a1a] p-6 shadow-sm">
              <h2 className="text-sm font-black text-gray-900 dark:text-gray-100 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-500" />
                Milestone Tracking
              </h2>
              <div className="flex items-center gap-6">
                <div className="relative w-24 h-24 shrink-0">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeWidth="3" className="text-gray-100 dark:text-[#1a1a1a]" />
                    <circle
                      cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeWidth="3"
                      strokeDasharray={`${milestoneRate * 0.879} 87.9`}
                      className="text-purple-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-black text-gray-900 dark:text-gray-100">{milestoneRate}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-black text-gray-900 dark:text-gray-100">
                    {stats.completedMilestones}
                    <span className="text-lg text-gray-400 font-medium"> / {stats.totalMilestones}</span>
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Milestones completed across all projects</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Projects Tab */}
        {activeTab === "projects" && (
          <div className="space-y-4">
            {projects.map((project) => {
              const done = project.tasks.filter((t) => t.status === "COMPLETED").length;
              const total = project.tasks.length;
              const rate = total > 0 ? Math.round((done / total) * 100) : 0;
              return (
                <div
                  key={project.id}
                  className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-gray-100 dark:border-[#1a1a1a] p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-black text-gray-900 dark:text-gray-100">{project.name}</h3>
                      <span className={`mt-1 inline-block text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                        project.status === "COMPLETED"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                          : project.status === "IN_PROGRESS"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                      }`}>{project.status.replace("_", " ")}</span>
                    </div>
                    <Link
                      href={`/manager/projects/${project.id}`}
                      className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      View →
                    </Link>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-gray-50 dark:bg-[#111] rounded-xl">
                      <p className="text-lg font-black text-gray-900 dark:text-gray-100">{total}</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">Tasks</p>
                    </div>
                    <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl">
                      <p className="text-lg font-black text-emerald-700 dark:text-emerald-400">{done}</p>
                      <p className="text-[10px] text-emerald-600/70 dark:text-emerald-500/70 uppercase tracking-wider">Done</p>
                    </div>
                    <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl">
                      <p className="text-lg font-black text-amber-700 dark:text-amber-400">{project.milestones.length}</p>
                      <p className="text-[10px] text-amber-600/70 dark:text-amber-500/70 uppercase tracking-wider">Milestones</p>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] mb-1.5">
                      <span className="text-gray-500">Task Completion</span>
                      <span className="font-bold text-gray-900 dark:text-gray-100">{rate}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-[#1a1a1a] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-700"
                        style={{ width: `${rate}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
            {projects.length === 0 && (
              <div className="text-center py-20 text-gray-400">
                <FolderKanban className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">No projects found</p>
              </div>
            )}
          </div>
        )}

        {/* Risks Tab */}
        {activeTab === "risks" && (
          <div className="space-y-6">
            {/* Blocked Tasks */}
            <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-gray-100 dark:border-[#1a1a1a] p-6 shadow-sm">
              <h2 className="text-sm font-black text-red-600 dark:text-red-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" />
                Blocked Tasks ({blockedTasks.length})
              </h2>
              {blockedTasks.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-400 opacity-60" />
                  <p className="text-sm">No blocked tasks — great!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {blockedTasks.map((task: any) => (
                    <div key={task.id} className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-xl">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 dark:text-gray-100 truncate">{task.title}</p>
                          <p className="text-[11px] text-gray-500 mt-0.5">{task.project?.name}</p>
                          {task.blockerReason && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-2 bg-red-100 dark:bg-red-900/20 px-2 py-1 rounded-lg">
                              🚧 {task.blockerReason}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className={`text-[9px] px-2 py-0.5 rounded-md font-black uppercase border ${PRIORITY_COLOR[task.priority] || ""}`}>
                            {task.priority}
                          </span>
                          {task.assignedTo && (
                            <span className="text-[10px] text-gray-500">{task.assignedTo.fullName}</span>
                          )}
                        </div>
                      </div>
                      <Link
                        href={`/manager/tasks/${task.id}`}
                        className="mt-3 inline-block text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Resolve Blocker →
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Overdue Tasks */}
            <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-gray-100 dark:border-[#1a1a1a] p-6 shadow-sm">
              <h2 className="text-sm font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Overdue Tasks ({overdueTasks.length})
              </h2>
              {overdueTasks.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-400 opacity-60" />
                  <p className="text-sm">All tasks on schedule!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {overdueTasks.map((task: any) => {
                    const daysOver = Math.floor(
                      (Date.now() - new Date(task.dueDate).getTime()) / 86400000
                    );
                    return (
                      <div key={task.id} className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-xl">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 dark:text-gray-100 truncate">{task.title}</p>
                            <p className="text-[11px] text-gray-500 mt-0.5">{task.project?.name}</p>
                          </div>
                          <div className="flex flex-col items-end shrink-0 gap-1">
                            <span className="text-[10px] font-black text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20 px-2 py-0.5 rounded-md">
                              {daysOver}d overdue
                            </span>
                            {task.assignedTo && (
                              <span className="text-[10px] text-gray-500">{task.assignedTo.fullName}</span>
                            )}
                          </div>
                        </div>
                        <Link
                          href={`/manager/tasks/${task.id}`}
                          className="mt-3 inline-block text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Reschedule →
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
