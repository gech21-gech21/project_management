// app/manager/projects/[projectId]/page.tsx
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, use } from "react";
import Link from "next/link";
import TaskModal from "@/app/components/teamleader/TaskModal";
import TaskDetailsModal from "@/app/components/teamleader/TaskDetailsModal";

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  priority: string;
  startDate: string | null;
  endDate: string | null;
  budget: number | null;
  createdAt: string;
  updatedAt: string;
  department: {
    id: string;
    name: string;
  };
  team: {
    id: string;
    name: string;
    teamLead: {
      id: string;
      fullName: string;
      email: string;
    } | null;
  } | null;
  projectManager: {
    id: string;
    fullName: string;
    email: string;
    department?: {
        name: string;
    };
    teamMemberships?: {
        team: {
            name: string;
            teamLead?: {
                fullName: string;
                email: string;
            };
        };
    }[];
  } | null;
  createdBy: {
    id: string;
    fullName: string;
    email: string;
  };
  tasks: Task[];
  _count?: {
    tasks: number;
    projectMembers: number;
  };
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  assignedTo: {
    id: string;
    fullName: string;
    email: string;
  } | null;
  assignedToId: string | null;
  createdBy: {
    id: string;
    fullName: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface TeamMember {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

export default function PROJECT_MANAGERProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const unwrappedParams = use(params);
  const projectId = unwrappedParams.projectId;
  const { data: session, status } = useSession();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "tasks">("overview");

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user) {
      router.push("/auth");
      return;
    }

    if (!["ADMIN", "PROJECT_MANAGER"].includes(session.user.role)) {
      router.push("/dashboard");
      return;
    }

    fetchProject();
    fetchTeamMembers();
  }, [session, status, router, projectId]);

  const fetchProject = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/manager/projects/${projectId}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Project not found");
        }
        throw new Error("Failed to fetch project");
      }
      const data = await response.json();
      const projectData = data.data;
      if (projectData && Array.isArray(projectData.tasks)) {
        projectData.tasks = projectData.tasks.map((task: any) => ({
          ...task,
          assignedToId: task.assignedTo?.id ?? null,
        }));
      }
      setProject(projectData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load project");
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch(`/api/manager/team/members?projectId=${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setTeamMembers(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch team members:", error);
    }
  };

  const handleCreateTask = () => {
    setSelectedTask(null);
    setShowTaskModal(true);
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  const handleViewTask = (task: Task) => {
    setSelectedTask(task);
    setShowTaskDetails(true);
  };

  const handleTaskSuccess = () => {
    fetchProject();
    setShowTaskModal(false);
    setSelectedTask(null);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "bg-red-100 text-red-800";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800";
      case "LOW":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading project details...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Project Not Found</h2>
          <p className="text-gray-600 mb-6">
            {error || "The project you're looking for doesn't exist or you don't have access to it."}
          </p>
          <Link
            href="/manager/projects"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/manager/projects"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Projects
          </Link>

          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">{project.name}</h1>
              <p className="mt-3 text-lg font-medium text-gray-600 dark:text-gray-400 leading-relaxed">
                {project.description || "No description provided"}
              </p>
            </div>
            <div className="flex gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(project.status)}`}>
                {project.status.replace("_", " ")}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityBadgeColor(project.priority)}`}>
                {project.priority} Priority
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab("overview")}
              className={`py-4 px-1 border-b-2 font-bold text-base ${activeTab === "overview"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("tasks")}
              className={`py-4 px-1 border-b-2 font-bold text-base ${activeTab === "tasks"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              Tasks ({project.tasks?.length || 0})
            </button>
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Project Details Grid */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 uppercase tracking-tight">Project Information</h3>
              </div>
              <div className="p-6">
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Department</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {project.department?.name || project.projectManager?.department?.name || "Not assigned"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Assigned Team</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {project.team?.name || (project.projectManager?.teamMemberships?.[0]?.team?.name) || "Not assigned"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Team Lead</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {project.team?.teamLead ? (
                        <div>
                          <p>{project.team.teamLead.fullName}</p>
                          <p className="text-xs text-gray-500">{project.team.teamLead.email}</p>
                        </div>
                      ) : (project.projectManager?.teamMemberships?.[0]?.team?.teamLead) ? (
                        <div>
                          <p>{project.projectManager.teamMemberships[0].team.teamLead.fullName}</p>
                          <p className="text-xs text-gray-500">{project.projectManager.teamMemberships[0].team.teamLead.email}</p>
                        </div>
                      ) : (
                        "Not assigned"
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Project Manager</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {project.projectManager ? (
                        <div>
                          <p>{project.projectManager.fullName}</p>
                          <p className="text-xs text-gray-500">{project.projectManager.email}</p>
                        </div>
                      ) : (
                        "Not assigned"
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Created By</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {project.createdBy ? (
                        <div>
                          <p>{project.createdBy.fullName}</p>
                          <p className="text-xs text-gray-500">{project.createdBy.email}</p>
                        </div>
                      ) : (
                        "Not assigned"
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Start Date</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatDate(project.startDate)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">End Date</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatDate(project.endDate)}</dd>
                  </div>
                  {project.budget && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Budget</dt>
                      <dd className="mt-1 text-sm text-gray-900">${project.budget.toLocaleString()}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Created At</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatDate(project.createdAt)}</dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-base font-bold text-gray-500 uppercase tracking-tighter">Total Tasks</p>
                    <p className="text-3rd font-black text-gray-900">{project._count?.tasks || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-base font-bold text-gray-500 uppercase tracking-tighter">Completed Tasks</p>
                    <p className="text-3rd font-black text-gray-900">
                      {project.tasks?.filter(t => t.status === "COMPLETED").length || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-purple-100 rounded-lg p-3">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-base font-bold text-gray-500 uppercase tracking-tighter">Team Members</p>
                    <p className="text-3xl font-black text-gray-900">{teamMembers.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Tasks Preview */}
            {project.tasks && project.tasks.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Recent Tasks</h3>
                  <button
                    onClick={() => setActiveTab("tasks")}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    View All
                  </button>
                </div>
                <div className="divide-y divide-gray-200">
                  {project.tasks.slice(0, 5).map((task) => (
                    <div key={task.id} className="px-6 py-4 hover:bg-gray-50 cursor-pointer" onClick={() => handleViewTask(task)}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">{task.title}</h4>
                          {task.description && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-1">{task.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(task.status)}`}>
                              {task.status.replace("_", " ")}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadgeColor(task.priority)}`}>
                              {task.priority}
                            </span>
                            {task.assignedTo && (
                              <span className="text-xs text-gray-500">
                                Assigned to: {task.assignedTo.fullName}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          Due: {formatDate(task.dueDate)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === "tasks" && (
          <div className="space-y-6">
            {/* Tasks Header */}
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Project Tasks</h2>
              <button
                onClick={handleCreateTask}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Create Task
              </button>
            </div>

            {/* Tasks List */}
            {project.tasks && project.tasks.length > 0 ? (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="divide-y divide-gray-200">
                  {project.tasks.map((task) => (
                    <div key={task.id} className="px-6 py-4 hover:bg-gray-50 cursor-pointer" onClick={() => handleViewTask(task)}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h4 className="text-sm font-medium text-gray-900">{task.title}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(task.status)}`}>
                              {task.status.replace("_", " ")}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadgeColor(task.priority)}`}>
                              {task.priority}
                            </span>
                          </div>
                          {task.description && (
                            <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            {task.assignedTo && (
                              <span>Assigned to: {task.assignedTo.fullName}</span>
                            )}
                            <span>Created by: {task.createdBy.fullName}</span>
                            <span>Due: {formatDate(task.dueDate)}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditTask(task);
                            }}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Tasks Created</h3>
                <p className="text-gray-600 mb-6">
                  Start by creating tasks for your team members
                </p>
                <button
                  onClick={handleCreateTask}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Create First Task
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Task Modal */}
      {showTaskModal && (
        <TaskModal
          projectId={projectId}
          task={selectedTask}
          teamMembers={teamMembers}
          onClose={() => {
            setShowTaskModal(false);
            setSelectedTask(null);
          }}
          onSuccess={handleTaskSuccess}
        />
      )}

      {/* Task Details Modal */}
      {showTaskDetails && selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          onClose={() => {
            setShowTaskDetails(false);
            setSelectedTask(null);
          }}
          onEdit={() => {
            setShowTaskDetails(false);
            setShowTaskModal(true);
          }}
        />
      )}
    </div>
  );
}
