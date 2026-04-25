//admin/page.tsx
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Users, 
  FolderKanban, 
  Activity, 
  LayoutDashboard, 
  CheckSquare,
  TrendingUp,
  ShieldCheck,
  Building2 
} from "lucide-react";

interface AdminStats {
  totalUsers: number;
  totalProjects: number;
  totalTasks: number;
  activeUsers: number;
  completedTasks: number;
  pendingTasks: number;
  totalTeams: number;
  totalDepartments: number;
  analytics: {
    tasks: { label: string; count: number }[];
    projects: { label: string; count: number }[];
    roles: { label: string; count: number }[];
  };
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
  description: string | null;
  status: string;
  priority: string;
  progress: number;
  projectManager: {
    fullName: string;
  } | null;
}

interface Task {
  id: string;
  title: string;
  taskCode: string | null;
  status: string;
  priority: string;
  dueDate: Date | null;
  project: {
    name: string;
  };
  assignedTo: {
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

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (session?.user?.role !== "ADMIN") {
      router.push("/dashboard");
    } else {
      fetchDashboardData();
    }
  }, [status, session, router]);

  const fetchDashboardData = async () => {
    try {
      const statsRes = await fetch("/api/admin/stats");
      const statsData = await statsRes.json();
      setStats(statsData.data);

      const usersRes = await fetch("/api/admin/users?limit=5");
      const usersData = await usersRes.json();
      setRecentUsers(usersData.data || []);

      const projRes = await fetch("/api/admin/projects?limit=5");
      const projData = await projRes.json();
      setRecentProjects(projData.data || []);

      const taskRes = await fetch("/api/admin/tasks?limit=5");
      const taskData = await taskRes.json();
      setRecentTasks(taskData.data || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-[#0a0a0a]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] animate-pulse">Initializing Nexus...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Analytics Section */}
        <div className="mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Primary Metrics */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { label: 'Total Personnel', value: stats?.activeUsers || 0, total: stats?.totalUsers || 0, icon: Users, color: 'text-blue-500', trend: '+12.5%' },
                { label: 'Active Projects', value: stats?.totalProjects || 0, total: stats?.totalProjects || 0, icon: FolderKanban, color: 'text-emerald-500', trend: '+3.2%' },
                { label: 'Network Tasks', value: stats?.completedTasks || 0, total: stats?.totalTasks || 0, icon: CheckSquare, color: 'text-amber-500', trend: '+5.7%' },
                { label: 'Active Sessions', value: stats?.activeUsers || 0, total: stats?.totalUsers || 0, icon: Activity, color: 'text-violet-500', trend: 'STABLE' },
              ].map((item) => (
                <div key={item.label} className="bg-white dark:bg-[#0a0a0a] rounded-2xl shadow-sm border border-gray-100 dark:border-[#1a1a1a] p-6 hover:shadow-xl transition-all group overflow-hidden relative">
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                      <div className={`p-3 rounded-xl bg-gray-50 dark:bg-white/5 transition-colors group-hover:bg-blue-50/50 dark:group-hover:bg-blue-500/10`}>
                        <item.icon className={`w-5 h-5 ${item.color}`} />
                      </div>
                      <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-full">{item.trend}</span>
                    </div>
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">{item.label}</h3>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-4xl font-black text-gray-900 dark:text-gray-100 tracking-tighter">{item.value}</span>
                      <span className="text-xs font-bold text-gray-400 italic">/ {item.total}</span>
                    </div>
                  </div>
                  <div className="absolute -bottom-2 -right-2 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                    <item.icon size={120} />
                  </div>
                </div>
              ))}
            </div>

            {/* User Roles */}
            <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-[#1a1a1a] relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-5">
                  <ShieldCheck size={100} />
               </div>
              <h3 className="text-xs font-bold text-gray-400 mb-6 uppercase tracking-[0.2em] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Ecosystem Roles
              </h3>
              <div className="space-y-4">
                {(stats?.analytics?.roles || []).map((item, idx) => {
                  const percentage = Math.round((item.count / (stats?.totalUsers || 1)) * 100);
                  const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-violet-500'];
                  return (
                    <div key={item.label} className="group cursor-default">
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-[11px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-tighter group-hover:text-blue-500 transition-colors">{item.label}</span>
                        <span className="text-[10px] font-mono text-gray-400">{item.count} NODES</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-50 dark:bg-white/5 rounded-full overflow-hidden border border-gray-100/50 dark:border-white/5">
                        <div 
                          className={`h-full ${colors[idx % 4]} transition-all duration-1000 shadow-[0_0_8px_rgba(37,99,235,0.3)]`} 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-8 pt-6 border-t border-gray-50 dark:border-white/5">
                 <p className="text-[10px] text-gray-400 font-medium italic opacity-50 uppercase tracking-tighter">
                   Authority Distribution Metrics v1.0
                 </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Asset Control', sub: 'Project Database', icon: FolderKanban, color: 'text-blue-500', bg: 'bg-blue-50/50', href: '/admin/projects' },
            { label: 'Personnel', sub: 'User Management', icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-50/50', href: '/admin/users' },
            { label: 'Units', sub: 'Team Structures', icon: ShieldCheck, color: 'text-violet-500', bg: 'bg-violet-50/50', href: '/admin/teams' },
            { label: 'Nexus', sub: 'Departmental Nodes', icon: Building2, color: 'text-amber-500', bg: 'bg-amber-50/50', href: '/admin/departments' },
          ].map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="group bg-white dark:bg-[#0a0a0a] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-[#1a1a1a] hover:border-blue-500/50 dark:hover:border-blue-400/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/5"
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${action.bg} dark:bg-white/5 transition-transform group-hover:scale-110`}>
                  <action.icon className={`w-6 h-6 ${action.color}`} />
                </div>
                <div>
                  <h3 className="text-xs font-black text-gray-900 dark:text-gray-100 uppercase tracking-widest">{action.label}</h3>
                  <p className="text-[10px] font-mono text-gray-400 dark:text-gray-500 mt-0.5">{action.sub}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Recent Users */}
        <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl shadow-sm border border-gray-100 dark:border-[#1a1a1a] overflow-hidden mb-12">
          <div className="px-8 py-6 border-b border-gray-100 dark:border-[#1a1a1a] flex justify-between items-center bg-gray-50/30 dark:bg-white/5">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              Latest Personnel Onboarded
            </h2>
            <Link
              href="/admin/users"
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 uppercase tracking-widest transition-colors"
            >
              Master Directory →
            </Link>
          </div>

          {recentUsers?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 dark:divide-[#1a1a1a]">
                <thead className="bg-gray-50 dark:bg-white/5">
                  <tr>
                    <th className="px-8 py-4 text-left text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">IDENTIFIER</th>
                    <th className="px-8 py-4 text-left text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">AUTHORITY</th>
                    <th className="px-8 py-4 text-left text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">VITALITY</th>
                    <th className="px-8 py-4 text-left text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">VERIFICATION</th>
                    <th className="px-8 py-4 text-left text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">DEPARTMENT</th>
                    <th className="px-8 py-4 text-left text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">EPOCH</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-[#1a1a1a]">
                  {recentUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors group">
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-[10px] font-black text-white border-2 border-white dark:border-[#1a1a1a] shadow-sm group-hover:scale-110 transition-transform">
                            {user.fullName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-900 dark:text-gray-100">{user.fullName}</p>
                            <p className="text-[10px] font-mono text-gray-400">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <span className="px-2 py-1 rounded-md bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${user.status === 'ACTIVE' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-gray-300'}`}></div>
                          <span className="text-[10px] font-bold text-gray-600 dark:text-gray-400 tracking-tighter uppercase">{user.status}</span>
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <span className={`text-[10px] font-black tracking-tighter uppercase ${user.emailVerified ? 'text-blue-500' : 'text-amber-500 opacity-50'}`}>
                          {user.emailVerified ? 'ESTABLISHED' : 'PENDING'}
                        </span>
                      </td>
                      <td className="px-8 py-4">
                         <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tighter">
                           {user.department?.name || 'N/A'}
                         </p>
                      </td>
                      <td className="px-8 py-4">
                        <p className="text-[10px] font-mono text-gray-400 italic">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-20 text-center bg-gray-50/50 dark:bg-white/[0.02]">
               <div className="text-4xl opacity-20 mb-4 animate-pulse">📡</div>
               <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Awaiting Entity Transmission</h3>
            </div>
          )}
        </div>

        {/* Main Grid: Projects & Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Projects */}
          <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl shadow-sm border border-gray-100 dark:border-[#1a1a1a] overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-100 dark:border-[#1a1a1a] flex justify-between items-center bg-gray-50/30 dark:bg-white/5">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-500" />
                Active Assets
              </h2>
              <Link
                href="/admin/projects"
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition-colors uppercase tracking-widest"
              >
                Full Archive →
              </Link>
            </div>

            {recentProjects?.length > 0 ? (
              <div className="p-6 space-y-4">
                {recentProjects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/admin/projects/${project.id}`}
                    className="block p-4 rounded-xl border border-gray-50 dark:border-white/5 bg-gray-50/20 dark:bg-white/[0.02] hover:bg-white dark:hover:bg-white/5 transition-all group hover:shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 transition-colors">
                          {project.name}
                        </h3>
                        {project.code && (
                          <p className="text-[10px] font-mono text-gray-400 uppercase tracking-tight mt-1">
                             {project.code}
                          </p>
                        )}
                      </div>
                      <span className={`px-2 py-0.5 text-[9px] font-black rounded-full border ${
                        project.status === "COMPLETED" ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/10 dark:text-emerald-400 dark:border-emerald-900/20" :
                        "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/10 dark:text-blue-400 dark:border-blue-900/20"
                      }`}>
                        {project.status}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="w-full bg-gray-50 dark:bg-white/5 rounded-full h-1.5 overflow-hidden border border-gray-100/50 dark:border-white/5">
                        <div
                          className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(37,99,235,0.3)]"
                          style={{ width: `${project.progress}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className="text-gray-400 uppercase tracking-widest">Momentum</span>
                        <span className="text-blue-600 dark:text-blue-400 font-mono italic">{project.progress}%</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-20 text-center">
                <div className="text-4xl mb-4 opacity-20">📊</div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">No Projects Registered</h3>
              </div>
            )}
          </div>

          {/* Recent Tasks */}
          <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl shadow-sm border border-gray-100 dark:border-[#1a1a1a] overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-100 dark:border-[#1a1a1a] flex justify-between items-center bg-gray-50/30 dark:bg-white/5">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-amber-500" />
                Atomic Operations
              </h2>
              <Link
                href="/admin/tasks"
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-500 transition-colors uppercase tracking-widest"
              >
                Full List →
              </Link>
            </div>

            {recentTasks?.length > 0 ? (
              <div className="p-6 space-y-4">
                {recentTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 rounded-xl border border-gray-50 dark:border-white/5 bg-gray-50/20 dark:bg-white/[0.02] hover:bg-white dark:hover:bg-white/5 transition-all group hover:shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {task.title}
                        </h3>
                        {task.taskCode && (
                          <p className="text-[10px] font-mono text-gray-400 uppercase tracking-tight mt-1">
                            {task.taskCode}
                          </p>
                        )}
                      </div>
                      <span className={`px-2 py-0.5 text-[9px] font-black rounded-full border ${
                        task.status === "COMPLETED" ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/10 dark:text-emerald-400 dark:border-emerald-900/20" :
                        "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/10 dark:text-blue-400 dark:border-blue-900/20"
                      }`}>
                        {task.status}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5 uppercase tracking-tighter">
                        <FolderKanban size={12} className="opacity-40" />
                        {task.project.name}
                      </p>
                      <div className="flex items-center justify-between mt-2 pt-3 border-t border-gray-100/50 dark:border-white/5">
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-0.5 bg-gray-50 dark:bg-white/5 rounded text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase">
                            {task.priority}
                          </span>
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                            {task.assignedTo?.fullName || "Unassigned"}
                          </span>
                        </div>
                        {task.dueDate && (
                          <span className="text-[10px] font-mono text-gray-400 tracking-tighter italic">
                            {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-20 text-center">
                <div className="text-4xl mb-4 opacity-20">✅</div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">No Active Tasks</h3>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
