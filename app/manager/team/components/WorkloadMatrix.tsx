"use client";

import { 
    Users, 
    CheckCircle2, 
    Clock, 
    AlertCircle, 
    ClipboardList,
    TrendingUp,
    LayoutGrid,
    BarChart3,
    ArrowUpRight
} from "lucide-react";
import { format } from "date-fns";

interface WorkloadMatrixProps {
    team: {
        name: string;
        members: {
            id: string;
            userId: string;
            user: {
                id: string;
                fullName: string;
                email: string;
                avatarUrl?: string | null;
                role: string;
                specialization?: string | null;
            };
        }[];
    };
    memberWorkload: {
        userId: string;
        todo: number;
        inProgress: number;
        review: number;
        completed: number;
        total: number;
        activeTasks: any[];
    }[];
    allTasks: any[];
}

export function WorkloadMatrix({ team, memberWorkload, allTasks }: WorkloadMatrixProps) {
    return (
        <div className="min-h-screen bg-[#fafafa] dark:bg-[#050505] p-6 lg:p-8 space-y-8 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-gray-200 dark:border-white/5">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-blue-500/10 rounded-lg">
                            <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em]">Operational Insights</span>
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic">
                        Workload <span className="text-blue-600">Matrix</span>
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium"> Real-time capacity and performance analytics for {team.name}</p>
                </div>
                
                <div className="flex gap-4">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Backlog</span>
                        <span className="text-2xl font-black text-gray-900 dark:text-white">{allTasks.length} Units</span>
                    </div>
                </div>
            </div>

            {/* High-Level Overview Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Deployment Ready', value: memberWorkload.filter(m => m.total < 5).length, sub: 'Low Workload Personnel', icon: Users, color: 'blue' },
                    { label: 'Active Ops', value: allTasks.filter(t => t.status === 'IN_PROGRESS').length, sub: 'Currently In Progress', icon: Clock, color: 'amber' },
                    { label: 'Success Rate', value: `${allTasks.length ? Math.round((allTasks.filter(t => t.status === 'COMPLETED').length / allTasks.length) * 100) : 0}%`, sub: 'Completed Ratio', icon: CheckCircle2, color: 'emerald' },
                    { label: 'Critical Path', value: allTasks.filter(t => t.status === 'TODO').length, sub: 'Pending Initiation', icon: AlertCircle, color: 'rose' },
                ].map((stat, i) => (
                    <div key={i} className="glass-card p-6 rounded-3xl relative overflow-hidden group hover:scale-[1.02] transition-all cursor-default">
                        <div className="relative z-10">
                            <div className={`w-10 h-10 rounded-2xl bg-${stat.color}-500/10 flex items-center justify-center mb-4 transition-transform group-hover:rotate-12`}>
                                <stat.icon className={`w-5 h-5 text-${stat.color}-500`} />
                            </div>
                            <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter mb-1">{stat.value}</p>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{stat.label}</p>
                            <p className="text-[10px] font-medium text-gray-400/60 mt-1">{stat.sub}</p>
                        </div>
                        <div className="absolute -bottom-4 -right-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                            <stat.icon size={100} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Matrix View */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Personnel Workload List */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <LayoutGrid className="w-4 h-4 text-blue-500" />
                            Personnel Capacity
                        </h2>
                    </div>

                    <div className="space-y-4">
                        {team.members.map((member) => {
                            const workload = memberWorkload.find(w => w.userId === member.userId) || {
                                todo: 0, inProgress: 0, review: 0, completed: 0, total: 0
                            };
                            
                            const progress = workload.total > 0 
                                ? Math.round((workload.completed / workload.total) * 100) 
                                : 0;

                            return (
                                <div key={member.id} className="glass-card p-5 rounded-2xl group hover:shadow-2xl hover:shadow-blue-500/5 transition-all">
                                    <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                                        {/* Profile Info */}
                                        <div className="flex items-center gap-4 min-w-[240px]">
                                            <div className="relative">
                                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 p-[2px]">
                                                    <div className="w-full h-full rounded-full bg-white dark:bg-[#0a0a0a] flex items-center justify-center overflow-hidden">
                                                        <span className="text-lg font-black text-blue-600 dark:text-blue-400">
                                                            {member.user.fullName.charAt(0)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className={`absolute bottom-0 right-0 w-4 h-4 border-2 border-white dark:border-[#0a0a0a] rounded-full ${workload.inProgress > 0 ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight group-hover:text-blue-600 transition-colors">
                                                    {member.user.fullName}
                                                </h3>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{member.user.specialization || "Generalist"}</p>
                                            </div>
                                        </div>

                                        {/* Metrics Display */}
                                        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {[
                                                { label: 'Todo', val: workload.todo, color: 'text-gray-400' },
                                                { label: 'Active', val: workload.inProgress, color: 'text-amber-500' },
                                                { label: 'Review', val: workload.review, color: 'text-blue-500' },
                                                { label: 'Done', val: workload.completed, color: 'text-emerald-500' },
                                            ].map((m, idx) => (
                                                <div key={idx} className="flex flex-col items-center justify-center p-2 rounded-xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5">
                                                    <span className={`text-sm font-black ${m.color}`}>{m.val}</span>
                                                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{m.label}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Progress Section */}
                                        <div className="min-w-[120px] lg:text-right">
                                            <div className="flex items-center justify-between lg:justify-end gap-2 mb-2">
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Efficiency</span>
                                                <span className="font-mono text-xs font-black text-blue-600 dark:text-blue-400">{progress}%</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-blue-600 transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(37,99,235,0.3)]"
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right Sidebar: Quick stats & Actionable items */}
                <div className="space-y-8">
                    {/* Distribution Summary */}
                    <div className="glass-card p-8 rounded-3xl overflow-hidden relative">
                        <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2 relative z-10">
                            <BarChart3 className="w-4 h-4 text-purple-500" />
                            Work Distribution
                        </h2>
                        
                        <div className="space-y-6 relative z-10">
                            {[
                                { label: 'New Initiations', count: allTasks.filter(t => t.status === "TODO").length, color: 'bg-gray-400' },
                                { label: 'Active Missions', count: allTasks.filter(t => t.status === "IN_PROGRESS").length, color: 'bg-amber-500' },
                                { label: 'Internal Review', count: allTasks.filter(t => t.status === "REVIEW").length, color: 'bg-blue-500' },
                                { label: 'Successful Deploy', count: allTasks.filter(t => t.status === "COMPLETED").length, color: 'bg-emerald-500' },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <div className={`w-3 h-3 rounded-full ${item.color} shadow-sm`} />
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center mb-1.5">
                                            <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-tight">{item.label}</span>
                                            <span className="text-xs font-black text-gray-900 dark:text-white">{item.count}</span>
                                        </div>
                                        <div className="h-1 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full ${item.color} transition-all duration-1000`} 
                                                style={{ width: `${allTasks.length ? (item.count / allTasks.length) * 100 : 0}%` }} 
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full -translate-y-12 translate-x-12 blur-3xl" />
                    </div>

                    {/* Upcoming Deadlines */}
                    <div className="glass-card p-8 rounded-3xl">
                        <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <ClipboardList className="w-4 h-4 text-rose-500" />
                            Critical Deadlines
                        </h2>
                        
                        <div className="space-y-5">
                            {allTasks
                                .filter(t => t.status !== 'COMPLETED' && t.dueDate)
                                .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                                .slice(0, 5)
                                .map((task) => (
                                    <div key={task.id} className="flex items-start gap-4 group cursor-pointer">
                                        <div className="mt-1 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                                        <div className="flex-1">
                                            <p className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-tight group-hover:text-blue-600 transition-colors">
                                                {task.title}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{task.project.name}</span>
                                                <span className="text-[8px] font-mono text-rose-500/80 font-black italic">
                                                    {format(new Date(task.dueDate), "MMM d")}
                                                </span>
                                            </div>
                                        </div>
                                        <ArrowUpRight className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-all" />
                                    </div>
                                ))}
                            
                            {allTasks.filter(t => t.status !== 'COMPLETED' && t.dueDate).length === 0 && (
                                <p className="text-[10px] font-medium text-gray-400 italic">No pending mission deadlines detected.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
