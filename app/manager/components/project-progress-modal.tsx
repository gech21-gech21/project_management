"use client";

import { X, Users, CheckCircle2, Clock, AlertCircle } from "lucide-react";

interface User {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  role: string;
}

interface Task {
  id: string;
  title: string;
  taskCode: string | null;
  status: string;
  priority: string;
  dueDate: Date | null;
  assignedTo: User | null;
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
}

interface ProjectProgressModalProps {
  project: Project;
  onClose: () => void;
}

export function ProjectProgressModal({ project, onClose }: ProjectProgressModalProps) {
  const getStatusColor = (status: string) => {
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

  // Calculate task statistics
  const taskStats = {
    total: project.tasks.length,
    todo: project.tasks.filter(t => t.status === "TODO").length,
    inProgress: project.tasks.filter(t => t.status === "IN_PROGRESS").length,
    review: project.tasks.filter(t => t.status === "REVIEW").length,
    completed: project.tasks.filter(t => t.status === "COMPLETED").length,
  };

  // Group tasks by assignee
  const tasksByAssignee = project.projectMembers.map(member => ({
    user: member.user,
    tasks: project.tasks.filter(t => t.assignedTo?.id === member.user.id),
    completed: project.tasks.filter(
      t => t.assignedTo?.id === member.user.id && t.status === "COMPLETED"
    ).length,
  }));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{project.name}</h2>
            {project.code && (
              <p className="text-sm text-gray-500">{project.code}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Project Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-600 mb-1">Overall Progress</p>
              <p className="text-3xl font-bold text-blue-700">{project.progress}%</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-green-600 mb-1">Completed Tasks</p>
              <p className="text-3xl font-bold text-green-700">{taskStats.completed}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-purple-600 mb-1">Total Tasks</p>
              <p className="text-3xl font-bold text-purple-700">{taskStats.total}</p>
            </div>
          </div>

          {/* Task Status Breakdown */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Status</h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <Clock className="w-5 h-5 text-gray-600 mx-auto mb-1" />
                <p className="text-xs text-gray-500">To Do</p>
                <p className="text-xl font-bold text-gray-700">{taskStats.todo}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <AlertCircle className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                <p className="text-xs text-blue-600">In Progress</p>
                <p className="text-xl font-bold text-blue-700">{taskStats.inProgress}</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-3 text-center">
                <CheckCircle2 className="w-5 h-5 text-yellow-600 mx-auto mb-1" />
                <p className="text-xs text-yellow-600">Review</p>
                <p className="text-xl font-bold text-yellow-700">{taskStats.review}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto mb-1" />
                <p className="text-xs text-green-600">Completed</p>
                <p className="text-xl font-bold text-green-700">{taskStats.completed}</p>
              </div>
            </div>
          </div>

          {/* Team Member Progress */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Team Member Progress
            </h3>
            <div className="space-y-4">
              {tasksByAssignee.map(({ user, tasks, completed }) => (
                <div key={user.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {user.fullName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.fullName}</p>
                        <p className="text-xs text-gray-500">{user.role}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {completed}/{tasks.length} tasks
                      </p>
                      <p className="text-xs text-gray-500">
                        {tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0}% complete
                      </p>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full"
                      style={{
                        width: `${tasks.length > 0 ? (completed / tasks.length) * 100 : 0}%`,
                      }}
                    />
                  </div>

                  {/* Assigned Tasks Preview */}
                  {tasks.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-gray-500 mb-2">ASSIGNED TASKS</p>
                      <div className="space-y-2">
                        {tasks.slice(0, 3).map((task) => (
                          <div key={task.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  task.status === "COMPLETED"
                                    ? "bg-green-500"
                                    : task.status === "IN_PROGRESS"
                                    ? "bg-blue-500"
                                    : task.status === "REVIEW"
                                    ? "bg-yellow-500"
                                    : "bg-gray-500"
                                }`}
                              />
                              <span className="text-sm text-gray-700">{task.title}</span>
                            </div>
                            <span
                              className={`px-2 py-0.5 text-xs rounded-full ${getPriorityColor(
                                task.priority
                              )}`}
                            >
                              {task.priority}
                            </span>
                          </div>
                        ))}
                        {tasks.length > 3 && (
                          <p className="text-xs text-gray-500">
                            +{tasks.length - 3} more tasks
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
