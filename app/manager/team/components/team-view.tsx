"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { 
    Users, 
    Calendar, 
    CheckCircle2, 
    Clock, 
    AlertCircle,
    Mail,
    Phone,
    MapPin,
    MoreVertical,
    UserPlus,
    Settings,
    BarChart3,
    Shield
} from "lucide-react";
import Link from "next/link";

interface TeamViewProps {
    team: any;
    tasks: any[];
    projects: any[];
    currentUserId: string;
}

export function TeamView({ team, tasks, projects, currentUserId }: TeamViewProps) {
    const [activeTab, setActiveTab] = useState("overview");
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [availableUsers, setAvailableUsers] = useState<any[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [addingMember, setAddingMember] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [memberList, setMemberList] = useState(team.members);

    const completedTasks = tasks.filter(t => t.status === "COMPLETED").length;
    const inProgressTasks = tasks.filter(t => t.status === "IN_PROGRESS").length;
    const pendingTasks = tasks.filter(t => t.status === "TODO" || t.status === "PENDING").length;

    // Fetch all users to filter available ones
    const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
            const response = await fetch("/api/admin/users?limit=100");
            if (response.ok) {
                const data = await response.json();
                const users = data.data || [];
                // Filter out existing team members
                const existingMemberIds = memberList.map((m: any) => m.userId);
                const available = users.filter((u: any) => !existingMemberIds.includes(u.id));
                setAvailableUsers(available);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleAddMember = async () => {
        if (!selectedUserId) return;
        
        setAddingMember(true);
        try {
            const response = await fetch("/api/manager/team/members", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: selectedUserId, role: "MEMBER" })
            });

            if (response.ok) {
                const data = await response.json();
                setMemberList([...memberList, data.data]);
                setShowAddMemberModal(false);
                setSelectedUserId(null);
                setSearchTerm("");
            } else {
                const error = await response.json();
                alert(error.error || "Failed to add member");
            }
        } catch (error) {
            console.error("Error adding member:", error);
            alert("An error occurred while adding the member");
        } finally {
            setAddingMember(false);
        }
    };

    const filteredAvailableUsers = availableUsers.filter((u: any) => 
        u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        if (showAddMemberModal) {
            fetchUsers();
        }
    }, [showAddMemberModal]);
    
    return (
        <div className="min-h-screen bg-white dark:bg-[#0a0a0a] transition-colors duration-300">
            {/* Header */}
            <div className="bg-white dark:bg-[#0a0a0a] border-b border-gray-100 dark:border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <Shield className="w-4 h-4 text-blue-500" />
                                <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.3em]">Unit Overview</span>
                            </div>
                            <h1 className="text-4xl font-black text-gray-900 dark:text-gray-100 tracking-tighter uppercase">{team.name}</h1>
                            {team.description && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-2xl">{team.description}</p>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => setShowAddMemberModal(true)}
                                className="inline-flex items-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-500/25 active:scale-95"
                            >
                                <UserPlus className="h-4 w-4 mr-2" />
                                Deploy Personnel
                            </button>
                            <button className="p-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 transition-all">
                                <Settings className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                    
                    {/* Tabs */}
                    <div className="flex space-x-8 mt-10">
                        {["overview", "members", "tasks", "projects", "activity"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`pb-4 px-1 text-[11px] font-black uppercase tracking-widest transition-all ${
                                    activeTab === tab
                                        ? "text-blue-600 border-b-2 border-blue-600"
                                        : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            
            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {activeTab === "overview" && (
                    <div className="space-y-6">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                            {[
                                { label: 'Unit Strength', count: team.members.length, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50/50' },
                                { label: 'Mission Finish', count: completedTasks, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50/50' },
                                { label: 'Active Sync', count: inProgressTasks, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50/50' },
                                { label: 'Pending Ops', count: pendingTasks, icon: AlertCircle, color: 'text-violet-500', bg: 'bg-violet-50/50' },
                            ].map((stat) => (
                                <div key={stat.label} className="bg-white dark:bg-[#0a0a0a] rounded-2xl shadow-sm border border-gray-100 dark:border-[#1a1a1a] p-6 group hover:shadow-xl transition-all overflow-hidden relative">
                                    <div className="flex justify-between items-end relative z-10">
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                                            <p className="text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tighter">{stat.count}</p>
                                        </div>
                                        <div className={`p-3 rounded-xl ${stat.bg} dark:bg-white/5 transition-transform group-hover:scale-110`}>
                                            <stat.icon className={`h-5 w-5 ${stat.color}`} />
                                        </div>
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                                        <stat.icon size={80} />
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {/* Team Members List */}
                        <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl shadow-sm border border-gray-100 dark:border-[#1a1a1a] overflow-hidden">
                            <div className="px-8 py-6 border-b border-gray-100 dark:border-white/5 bg-gray-50/30 dark:bg-white/5">
                                <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Users className="w-4 h-4 text-blue-500" />
                                    Personnel Directory
                                </h2>
                            </div>
                            <div className="divide-y divide-gray-100 dark:divide-white/5">
                                {memberList.map((member: any) => (
                                    <div key={member.id} className="px-8 py-5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-black text-white border-2 border-white dark:border-[#1a1a1a] shadow-sm transform group-hover:scale-110 transition-transform">
                                                {member.user.fullName.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{member.user.fullName}</p>
                                                <p className="text-[10px] font-mono text-gray-400 dark:text-gray-500">{member.user.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider border ${
                                                member.role === "LEADER" 
                                                    ? "bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/10 dark:text-purple-400 dark:border-purple-900/20" 
                                                    : "bg-gray-50 text-gray-500 border-gray-100 dark:bg-white/5 dark:text-gray-400 dark:border-white/10"
                                            }`}>
                                                {member.role}
                                            </span>
                                            <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                                                <MoreVertical className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        {/* Recent Tasks */}
                        <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl shadow-sm border border-gray-100 dark:border-[#1a1a1a] overflow-hidden">
                            <div className="px-8 py-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-gray-50/30 dark:bg-white/5">
                                <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-emerald-500" />
                                    Active Operational Feed
                                </h2>
                                <Link href="/manager/tasks" className="text-[10px] font-black text-blue-600 dark:text-blue-400 hover:text-blue-500 uppercase tracking-widest transition-colors">
                                    Full Archive →
                                </Link>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full divide-y divide-gray-100 dark:divide-white/5">
                                    <thead className="bg-gray-50 dark:bg-white/5">
                                        <tr>
                                            <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Identifier</th>
                                            <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Asset</th>
                                            <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Assignee</th>
                                            <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Vitality</th>
                                            <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Epoch</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                        {tasks.map((task) => (
                                            <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors group">
                                                <td className="px-8 py-5">
                                                    <div className="text-xs font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 transition-colors">{task.title}</div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-tighter">{task.project.name}</span>
                                                </td>
                                                <td className="px-8 py-5">
                                                    {task.assignedTo && (
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-white/10 dark:to-white/5 flex items-center justify-center text-[8px] font-black text-gray-500 border border-white dark:border-[#1a1a1a]">
                                                                {task.assignedTo.fullName.charAt(0)}
                                                            </div>
                                                            <span className="text-[10px] font-bold text-gray-600 dark:text-gray-400">{task.assignedTo.fullName}</span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-8 py-5">
                                                    <span className={`px-2 py-1 rounded-md text-[9px] font-black border uppercase tracking-wider ${
                                                        task.status === "COMPLETED" ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" :
                                                        task.status === "IN_PROGRESS" ? "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20" :
                                                        "bg-gray-50 text-gray-500 border-gray-100 dark:bg-white/5 dark:text-gray-400 dark:border-white/10"
                                                    }`}>
                                                        {task.status}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <span className="text-[10px] font-mono text-gray-400 italic">
                                                        {task.dueDate ? format(new Date(task.dueDate), "MMM d, yyyy") : "-"}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
                
                {activeTab === "members" && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="px-6 py-4 border-b">
                            <h2 className="text-lg font-semibold text-gray-900">All Team Members</h2>
                        </div>
                        <div className="divide-y">
                            {memberList.map((member: any) => (
                                <div key={member.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-lg">
                                            {member.user.fullName.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{member.user.fullName}</p>
                                            <p className="text-sm text-gray-500">{member.user.email}</p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                Joined {member.joinedAt ? format(new Date(member.joinedAt), "MMM d, yyyy") : "Just now"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                                            member.role === "LEADER" 
                                                ? "bg-purple-100 text-purple-800" 
                                                : "bg-gray-100 text-gray-800"
                                        }`}>
                                            {member.role}
                                        </span>
                                        <button className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 border border-blue-200 rounded hover:bg-blue-50">
                                            Manage
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                {activeTab === "tasks" && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="px-6 py-4 border-b flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">All Team Tasks</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assignee</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {tasks.map((task) => (
                                        <tr key={task.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{task.title}</div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">{task.project.name}</td>
                                            <td className="px-6 py-4">
                                                {task.assignedTo && (
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center text-xs">
                                                            {task.assignedTo.fullName.charAt(0)}
                                                        </div>
                                                        <span className="text-gray-600">{task.assignedTo.fullName}</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                    task.status === "COMPLETED" ? "bg-green-100 text-green-800" :
                                                    task.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-800" :
                                                    "bg-gray-100 text-gray-800"
                                                }`}>
                                                    {task.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {task.dueDate ? format(new Date(task.dueDate), "MMM d, yyyy") : "-"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === "projects" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {projects.map((project: any) => (
                            <div key={project.id} className="bg-white dark:bg-[#0a0a0a] rounded-2xl shadow-sm border border-gray-100 dark:border-[#1a1a1a] overflow-hidden group hover:shadow-xl transition-all">
                                <div className="p-8">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-xl font-black text-gray-900 dark:text-gray-100 tracking-tighter uppercase">{project.name}</h3>
                                        <span className={`px-2 py-1 rounded-md text-[9px] font-black border uppercase tracking-wider ${
                                            project.status === "COMPLETED" ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" : "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20"
                                        }`}>
                                            {project.status}
                                        </span>
                                    </div>
                                    <p className="text-[10px] font-mono text-gray-400 uppercase tracking-tighter mb-4">{project.code}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 h-10 leading-relaxed mb-8">{project.description || "System asset awaiting classification."}</p>
                                    
                                    <div className="flex items-center justify-between mt-auto pt-6 border-t border-gray-100 dark:border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] font-black text-white border-2 border-white dark:border-[#1a1a1a] shadow-sm">
                                                {project.projectManager?.fullName.charAt(0)}
                                            </div>
                                            <span className="text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-tighter">{project.projectManager?.fullName}</span>
                                        </div>
                                        <Link 
                                            href={`/manager/projects/${project.id}`}
                                            className="text-[11px] font-black text-blue-600 dark:text-blue-400 hover:text-blue-500 uppercase tracking-widest transition-colors"
                                        >
                                            Infiltrate →
                                        </Link>
                                    </div>
                                </div>
                                <div className="bg-gray-50 dark:bg-white/5 px-8 py-5 border-t border-gray-100 dark:border-white/5">
                                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest mb-3">
                                        <span className="text-gray-400">Momentum</span>
                                        <span className="text-blue-600 dark:text-blue-400 font-mono italic">{project.progress}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
                                        <div className="bg-blue-600 h-1.5 rounded-full shadow-[0_0_8px_rgba(37,99,235,0.3)] transition-all duration-1000" style={{ width: `${project.progress}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === "activity" && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="px-6 py-4 border-b">
                            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
                        </div>
                        <div className="p-8 text-center text-gray-500">
                            <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <p>Activity tracking will be available soon.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Add Member Modal */}
            {showAddMemberModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-900">Add Team Member</h2>
                            <button 
                                onClick={() => setShowAddMemberModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <Users className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Search Users
                                </label>
                                <input
                                    type="text"
                                    placeholder="Search by name or email..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        // Trigger search logic here if needed
                                    }}
                                />
                            </div>

                            <div className="max-h-60 overflow-y-auto space-y-2 border border-gray-100 rounded-lg p-2">
                                {loadingUsers ? (
                                    <p className="text-sm text-gray-500 text-center py-4">Loading users...</p>
                                ) : filteredAvailableUsers.length > 0 ? (
                                    filteredAvailableUsers.map((user: any) => (
                                        <div 
                                            key={user.id}
                                            onClick={() => setSelectedUserId(user.id)}
                                            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                                                selectedUserId === user.id ? "bg-blue-50 border-blue-200 border" : "hover:bg-gray-50 border border-transparent"
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium">
                                                    {user.fullName.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{user.fullName}</p>
                                                    <p className="text-xs text-gray-500">{user.email}</p>
                                                </div>
                                            </div>
                                            {selectedUserId === user.id && (
                                                <div className="h-4 w-4 bg-blue-600 rounded-full flex items-center justify-center">
                                                    <CheckCircle2 className="h-3 w-3 text-white" />
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500 text-center py-4">
                                        {searchTerm ? "No users found matching your search." : "No available users to add."}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="mt-6 flex gap-3 justify-end">
                            <button
                                onClick={() => {
                                    setShowAddMemberModal(false);
                                    setSelectedUserId(null);
                                    setSearchTerm("");
                                }}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddMember}
                                disabled={addingMember || !selectedUserId}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                {addingMember ? "Adding..." : "Add Member"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
