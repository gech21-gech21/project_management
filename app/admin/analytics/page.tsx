// app/admin/analytics/page.tsx
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  CheckSquare, 
  FolderKanban, 
  Building2, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  LayoutDashboard
} from "lucide-react";
import { motion } from "framer-motion";

interface AnalyticsData {
  overview: {
    totalProjects: number;
    totalTasks: number;
    totalUsers: number;
    totalDepartments: number;
  };
  projectStatus: { status: string; _count: { id: number } }[];
  taskStatus: { status: string; _count: { id: number } }[];
  taskPriority: { priority: string; _count: { id: number } }[];
  departmentBreakdown: {
    id: string;
    name: string;
    _count: {
      tasks: number;
      projects: number;
      users: number;
    };
  }[];
  recentTasks: any[];
}

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user || session.user.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }
    fetchAnalytics();
  }, [session, status, router]);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch("/api/admin/analytics");
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to fetch analytics");
      }
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      // You could set an error state here if you want to show it in the UI
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex items-center justify-center transition-colors duration-300">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] animate-pulse">Analyzing Neural Pathways...</p>
        </div>
      </div>
    );
  }

  if (!data || !data.overview) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex items-center justify-center transition-colors duration-300">
        <div className="text-center p-8 glass-card rounded-3xl border-rose-500/20">
          <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Activity className="w-8 h-8 text-rose-600" />
          </div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-widest mb-2">Neural Link Failure</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 max-w-xs mx-auto">
            Unable to aggregate operational data from the system nodes.
          </p>
          <button 
            onClick={() => {
              setLoading(true);
              fetchAnalytics();
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest"
          >
            Reconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Header */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-blue-500/10 rounded-lg">
                <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em]">Operational Intelligence</span>
            </div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic">
              System <span className="text-blue-600">Analytics</span>
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium">
              Real-time monitoring of organizational efficiency, project throughput, and resource allocation.
            </p>
          </div>
          <div className="flex items-center gap-4 px-6 py-3 bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/10 rounded-2xl">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
            <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">System Online: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            { label: "Active Projects", value: data.overview.totalProjects, icon: FolderKanban, color: "blue", trend: "+12%" },
            { label: "Deployment Tasks", value: data.overview.totalTasks, icon: CheckSquare, color: "purple", trend: "+5%" },
            { label: "Personnel Nodes", value: data.overview.totalUsers, icon: Users, color: "emerald", trend: "+2%" },
            { label: "Structural Units", value: data.overview.totalDepartments, icon: Building2, color: "orange", trend: "Stable" },
          ].map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="glass-card p-6 rounded-3xl group hover:scale-[1.02] transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 bg-${stat.color}-500/10 rounded-2xl group-hover:scale-110 transition-transform`}>
                  <stat.icon className={`w-6 h-6 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest ${idx % 2 === 0 ? 'text-emerald-500' : 'text-gray-400'} flex items-center gap-1`}>
                  {idx % 2 === 0 ? <ArrowUpRight size={10} /> : <Activity size={10} />}
                  {stat.trend}
                </span>
              </div>
              <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">{stat.value}</p>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Task Status Breakdown */}
          <div className="glass-card p-8 rounded-[2rem] border-gray-100 dark:border-white/5">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
              <TrendingUp size={12} className="text-blue-500" />
              Task Execution Flow
            </h3>
            <div className="space-y-6">
              {data.taskStatus.map((item, idx) => {
                const totalTasks = data.overview.totalTasks;
                const percentage = totalTasks > 0 ? Math.round((item._count.id / totalTasks) * 100) : 0;
                return (
                  <div key={item.status} className="group">
                    <div className="flex justify-between items-end mb-2">
                      <p className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest">{item.status.replace('_', ' ')}</p>
                      <p className="text-[10px] font-mono text-gray-400 font-bold">{item._count.id} NODES</p>
                    </div>
                    <div className="h-3 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1, delay: idx * 0.1 }}
                        className={`h-full rounded-full bg-gradient-to-r ${
                          idx === 0 ? 'from-blue-500 to-indigo-500' : 
                          idx === 1 ? 'from-purple-500 to-pink-500' : 
                          'from-emerald-500 to-teal-500'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
              {data.taskStatus.length === 0 && (
                <div className="py-12 text-center bg-gray-50 dark:bg-white/[0.02] rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No Execution Data Available</p>
                </div>
              )}
            </div>
          </div>

          {/* Department Efficiency */}
          <div className="glass-card p-8 rounded-[2rem] border-gray-100 dark:border-white/5">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
              <Building2 size={12} className="text-orange-500" />
              Department Resource Map
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {data.departmentBreakdown.slice(0, 4).map((dept) => (
                <div key={dept.id} className="p-5 bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-2xl hover:bg-white dark:hover:bg-white/[0.05] transition-all group">
                  <p className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-4 truncate">{dept.name}</p>
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-center">
                      <p className="text-lg font-black text-blue-600 dark:text-blue-400 leading-none">{dept._count.tasks}</p>
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-1">Tasks</p>
                    </div>
                    <div className="w-[1px] h-6 bg-gray-200 dark:bg-white/10" />
                    <div className="text-center">
                      <p className="text-lg font-black text-purple-600 dark:text-purple-400 leading-none">{dept._count.projects}</p>
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-1">Proj</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="glass-card p-8 rounded-[2rem] border-gray-100 dark:border-white/5">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <Clock size={12} className="text-emerald-500" />
              Recent Operational Shifts
            </h3>
            <button className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest hover:underline transition-all">View Full Logs</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-100 dark:border-white/5">
                <tr>
                  <th className="px-4 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Task ID</th>
                  <th className="px-4 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Project</th>
                  <th className="px-4 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Assigned To</th>
                  <th className="px-4 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-4 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {data.recentTasks.map((task) => (
                  <tr key={task.id} className="group hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-4">
                      <p className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-tight">{task.title}</p>
                      <p className="text-[9px] font-mono text-gray-400 font-bold uppercase">{task.taskCode || task.id.slice(0, 8)}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-tight">{task.project?.name}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center text-[10px] font-black text-blue-600">
                          {task.assignedTo?.fullName?.charAt(0) || '?'}
                        </div>
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-200">{task.assignedTo?.fullName || 'Unassigned'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2 py-1 bg-gray-100 dark:bg-white/5 text-[9px] font-black text-gray-500 uppercase tracking-widest rounded-md border border-gray-200 dark:border-white/10">
                        {task.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="text-[10px] font-mono text-gray-400">{new Date(task.createdAt).toLocaleDateString()}</span>
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
