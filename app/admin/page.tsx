//admin/page.tsx
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface AdminStats {
  totalUsers: number;
  totalProjects: number;
  totalTasks: number;
  activeUsers: number;
  completedTasks: number;
  pendingTasks: number;
  totalTeams: number;
  totalDepartments: number;
}

interface User {
  id: string;
  fullName: string;
  email: string;
  username: string;
  role: string;
  status: string;
  emailVerified: Date | null;
  createdAt: string;
  avatarUrl: string | null;
  department?: {
    name: string;
  } | null;
}

interface Project {
  id: string;
  name: string;
  code: string | null;
  status: string;
  priority: string;
  progress: number;
  createdAt: string;
  projectManager?: {
    fullName: string;
  } | null;
}

interface Task {
  id: string;
  title: string;
  taskCode: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  project: {
    name: string;
  };
  assignedTo?: {
    fullName: string;
  } | null;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user) {
      router.push("/auth");
      return;
    }

    if (session.user.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }

    fetchDashboardData();
  }, [session, status, router]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch stats
      try {
        const statsResponse = await fetch("/api/admin/stats");
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData.data);
        }
      } catch (statsError) {
        console.error("Stats fetch error:", statsError);
      }

      // Fetch recent users
      try {
        const usersResponse = await fetch("/api/admin/users?limit=5");
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          setRecentUsers(usersData.data || []);
        }
      } catch (usersError) {
        console.error("Users fetch error:", usersError);
      }

      // Fetch recent projects
      try {
        const projectsResponse = await fetch("/api/admin/projects?limit=5");
        if (projectsResponse.ok) {
          const projectsData = await projectsResponse.json();
          setRecentProjects(projectsData.data || []);
        }
      } catch (projectsError) {
        console.error("Projects fetch error:", projectsError);
      }

      // Fetch recent tasks
      try {
        const tasksResponse = await fetch("/api/admin/tasks?limit=5");
        if (tasksResponse.ok) {
          const tasksData = await tasksResponse.json();
          setRecentTasks(tasksData.data || []);
        }
      } catch (tasksError) {
        console.error("Tasks fetch error:", tasksError);
      }
    } catch (err) {
      console.error("General fetch error:", err);
      setError("Some admin data could not be loaded");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "INACTIVE":
      case "CANCELLED":
        return "bg-gray-100 text-gray-800";
      case "SUSPENDED":
      case "ON_HOLD":
        return "bg-red-100 text-red-800";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
      case "PLANNING":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
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
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!session?.user || session.user.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Warning */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <p className="text-red-600">⚠️ {error}</p>
              <button
                onClick={fetchDashboardData}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Welcome back,{" "}
            <span className="font-semibold text-blue-600">
              {session.user.name || session.user.email}
            </span>
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats?.totalUsers || 0}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              <span className="text-green-600 font-medium">
                {stats?.activeUsers || 0}
              </span>{" "}
              active users
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Projects
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats?.totalProjects || 0}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats?.totalTasks || 0}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
            </div>
            <div className="mt-2 flex gap-2 text-sm">
              <span className="text-green-600 font-medium">
                {stats?.completedTasks || 0}
              </span>
              <span className="text-gray-600">completed</span>
              <span className="text-yellow-600 font-medium ml-2">
                {stats?.pendingTasks || 0}
              </span>
              <span className="text-gray-600">pending</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Teams & Depts
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats?.totalTeams || 0}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <svg
                  className="w-6 h-6 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              <span className="text-yellow-600 font-medium">
                {stats?.totalDepartments || 0}
              </span>{" "}
              departments
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link
            href="/admin/users"
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">User Management</h3>
                <p className="text-sm text-gray-600">
                  Manage users, roles, and permissions
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/projects"
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Projects</h3>
                <p className="text-sm text-gray-600">
                  View and manage all projects
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/teams"
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Teams 
                </h3>
                <p className="text-sm text-gray-600">
                  Manage teams 
                </p>
              </div>
            </div>
          </Link>
          
          <Link
            href="/admin/departments"
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                 Departments
                </h3>
                <p className="text-sm text-gray-600">
                  Manage departments
                </p>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Users */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Users
            </h2>
            <Link
              href="/admin/users"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View All →
            </Link>
          </div>

          {recentUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Verification
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-medium">
                              {user.fullName?.charAt(0).toUpperCase() ||
                                user.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.fullName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.email}
                            </div>
                            <div className="text-xs text-gray-400">
                              @{user.username}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.role === "ADMIN"
                              ? "bg-purple-100 text-purple-800"
                              : user.role === "TEAMLEADER"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(user.status)}`}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.emailVerified
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {user.emailVerified ? "Verified" : "Unverified"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.department?.name || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Users Found
              </h3>
              <p className="text-gray-600">No users have registered yet.</p>
            </div>
          )}
        </div>

        {/* Two Column Layout for Projects and Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Projects */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Projects
              </h2>
              <Link
                href="/admin/projects"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                View All →
              </Link>
            </div>

            {recentProjects.length > 0 ? (
              <div className="p-6 space-y-4">
                {recentProjects.map((project) => (
                  <Link
                    href={`/admin/projects/${project.id}`}
                    key={project.id}
                    className="block hover:bg-gray-50 rounded-lg p-3 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {project.name}
                        </h3>
                        {project.code && (
                          <p className="text-sm text-gray-500">
                            {project.code}
                          </p>
                        )}
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.status)}`}
                      >
                        {project.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <span
                        className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getPriorityColor(project.priority)}`}
                      >
                        {project.priority}
                      </span>
                      <span>
                        Manager:{" "}
                        {project.projectManager?.fullName || "Unassigned"}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {project.progress}% complete
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Projects
                </h3>
                <p className="text-gray-600">
                  No projects have been created yet.
                </p>
              </div>
            )}
          </div>

          {/* Recent Tasks */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Tasks
              </h2>
              <Link
                href="/admin/tasks"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                View All →
              </Link>
            </div>

            {recentTasks.length > 0 ? (
              <div className="p-6 space-y-4">
                {recentTasks.map((task) => (
                  <div
                    key={task.id}
                    className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {task.title}
                        </h3>
                        {task.taskCode && (
                          <p className="text-xs text-gray-500">
                            {task.taskCode}
                          </p>
                        )}
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(task.status)}`}
                      >
                        {task.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Project: {task.project.name}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <span
                        className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getPriorityColor(task.priority)}`}
                      >
                        {task.priority}
                      </span>
                      <span className="text-gray-600">
                        Assigned to: {task.assignedTo?.fullName || "Unassigned"}
                      </span>
                      {task.dueDate && (
                        <span className="text-gray-500 text-xs">
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <div className="text-6xl mb-4">✅</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Tasks
                </h3>
                <p className="text-gray-600">No tasks have been created yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
