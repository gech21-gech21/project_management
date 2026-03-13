"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FolderKanban,
  Users,
  CheckCircle2,
  Plus,
  MessageSquare,
  Eye,
  BarChart3,
} from "lucide-react";
import { CreateTaskModal } from "./create-task-modal";
import { TaskDetailsModal } from "./task-details-modal";
import { ProjectProgressModal } from "./project-progress-modal";

interface User {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  role: string;
}

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  user: User;
}

interface Task {
  id: string;
  title: string;
  taskCode: string | null;
  description: string | null;
  status: string;
  priority: string;
  estimatedHours: number | null;
  actualHours: number | null;
  dueDate: Date | null;
  assignedTo: User | null;
  comments: Comment[];
}

interface ProjectMember {
  id: string;
  role: string;
  user: User;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  code: string | null;
  status: string;
  priority: string;
  startDate: Date | null;
  endDate: Date | null;
  progress: number;
  tasks: Task[];
  projectMembers: ProjectMember[];
  _count: {
    tasks: number;
    projectMembers: number;
  };
}

interface TeamInfo {
  id: string;
  name: string;
  description: string | null;
  members: {
    id: string;
    role: string;
    user: User;
  }[];
}

interface Stats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalTasks: number;
  pendingTasks: number;
  completedTasks: number;
}

interface TeamLeaderDashboardClientProps {
  projects: Project[];
  teamInfo: TeamInfo | null;
  stats: Stats;
}

export function TeamLeaderDashboardClient({
  projects,
  teamInfo,
  stats,
}: TeamLeaderDashboardClientProps) {
  const router = useRouter();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [showTaskDetailsModal, setShowTaskDetailsModal] = useState(false);
  const [showProjectProgressModal, setShowProjectProgressModal] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PLANNING":
        return "bg-gray-100 text-gray-800";
      case "IN_PROGRESS":
        return "bg-green-100 text-green-800";
      case "ON_HOLD":
        return "bg-yellow-100 text-yellow-800";
      case "COMPLETED":
        return "bg-blue-100 text-blue-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case "TODO":
        return "bg-gray-100 text-gray-800";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
      case "REVIEW":
        return "bg-yellow-100 text-yellow-800";
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "LOW":
        return "bg-blue-100 text-blue-800";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800";
      case "HIGH":
        return "bg-orange-100 text-orange-800";
      case "URGENT":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Team Leader Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Welcome back! Manage your projects and team tasks.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Projects</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalProjects}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <FolderKanban className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Projects</p>
                <p className="text-3xl font-bold text-gray-900">{stats.activeProjects}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalTasks}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              <span className="text-green-600 font-medium">{stats.completedTasks}</span> completed,{" "}
              <span className="text-yellow-600 font-medium">{stats.pendingTasks}</span> pending
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Team Members</p>
                <p className="text-3xl font-bold text-gray-900">
                  {teamInfo?.members.length || 0}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Users className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Team Info */}
        {teamInfo && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Your Team: {teamInfo.name}
              </h2>
              <Link
                href="/teamleader/team"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Manage Team →
              </Link>
            </div>
            {teamInfo.description && (
              <p className="text-gray-600 mb-4">{teamInfo.description}</p>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">
                  {teamInfo.members.length}
                </p>
                <p className="text-sm text-gray-600">Total Members</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">
                  {teamInfo.members.filter(m => m.role === "LEADER").length}
                </p>
                <p className="text-sm text-gray-600">Leaders</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">
                  {teamInfo.members.filter(m => m.role === "MEMBER").length}
                </p>
                <p className="text-sm text-gray-600">Members</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">
                  {projects.length}
                </p>
                <p className="text-sm text-gray-600">Projects</p>
              </div>
            </div>
          </div>
        )}

        {/* Projects Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Your Projects</h2>
            <Link
              href="/teamleader/projects"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View All Projects →
            </Link>
          </div>

          {projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.slice(0, 3).map((project) => (
                <div
                  key={project.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{project.name}</h3>
                        {project.code && (
                          <p className="text-xs text-gray-500">{project.code}</p>
                        )}
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                          project.status
                        )}`}
                      >
                        {project.status}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                      {project.description || "No description"}
                    </p>

                    <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{project._count.projectMembers} members</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{project._count.tasks} tasks</span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium">{project.progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedProject(project);
                          setShowProjectProgressModal(true);
                        }}
                        className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        Progress
                      </button>
                      <button
                        onClick={() => {
                          setSelectedProject(project);
                          setShowCreateTaskModal(true);
                        }}
                        className="flex-1 px-3 py-2 text-sm bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors flex items-center justify-center gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        Add Task
                      </button>
                    </div>
                  </div>

                  {/* Recent Tasks Preview */}
                  {project.tasks.length > 0 && (
                    <div className="border-t border-gray-200 bg-gray-50 p-4">
                      <p className="text-xs font-medium text-gray-500 mb-2">RECENT TASKS</p>
                      <div className="space-y-2">
                        {project.tasks.slice(0, 2).map((task) => (
                          <button
                            key={task.id}
                            onClick={() => {
                              setSelectedTask(task);
                              setShowTaskDetailsModal(true);
                            }}
                            className="w-full text-left p-2 bg-white rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {task.title}
                              </p>
                              <span
                                className={`px-2 py-0.5 text-xs rounded-full ${getTaskStatusColor(
                                  task.status
                                )}`}
                              >
                                {task.status}
                              </span>
                            </div>
                            {task.assignedTo && (
                              <p className="text-xs text-gray-500 mt-1">
                                Assigned to: {task.assignedTo.fullName}
                              </p>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <FolderKanban className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Projects Assigned
              </h3>
              <p className="text-gray-600">
                You haven't been assigned to any projects yet.
              </p>
            </div>
          )}
        </div>

        {/* All Tasks Overview */}
        {projects.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">All Tasks</h2>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="divide-y divide-gray-200">
                {projects.flatMap(p => p.tasks).slice(0, 5).map((task) => (
                  <button
                    key={task.id}
                    onClick={() => {
                      setSelectedTask(task);
                      setShowTaskDetailsModal(true);
                    }}
                    className="w-full p-4 hover:bg-gray-50 text-left transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-medium text-gray-900">{task.title}</h3>
                        {task.taskCode && (
                          <p className="text-xs text-gray-500">{task.taskCode}</p>
                        )}
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getTaskStatusColor(
                          task.status
                        )}`}
                      >
                        {task.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 text-xs rounded-full ${getPriorityColor(
                            task.priority
                          )}`}
                        >
                          {task.priority}
                        </span>
                        {task.assignedTo && (
                          <span className="text-gray-600">
                            Assigned to: {task.assignedTo.fullName}
                          </span>
                        )}
                      </div>
                      {task.dueDate && (
                        <span className="text-xs text-gray-500">
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {task.comments.length > 0 && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                        <MessageSquare className="w-3 h-3" />
                        <span>{task.comments.length} messages</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateTaskModal && selectedProject && (
        <CreateTaskModal
          project={selectedProject}
          teamMembers={teamInfo?.members.map(m => m.user) || []}
          onClose={() => {
            setShowCreateTaskModal(false);
            setSelectedProject(null);
          }}
          onTaskCreated={() => {
            router.refresh();
            setShowCreateTaskModal(false);
            setSelectedProject(null);
          }}
        />
      )}

      {showTaskDetailsModal && selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          onClose={() => {
            setShowTaskDetailsModal(false);
            setSelectedTask(null);
          }}
          onTaskUpdated={() => {
            router.refresh();
            setShowTaskDetailsModal(false);
            setSelectedTask(null);
          }}
        />
      )}

      {showProjectProgressModal && selectedProject && (
        <ProjectProgressModal
          project={selectedProject}
          onClose={() => {
            setShowProjectProgressModal(false);
            setSelectedProject(null);
          }}
        />
      )}
    </div>
  );
}