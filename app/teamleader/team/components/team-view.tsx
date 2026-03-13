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
    BarChart3
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
            const response = await fetch("/api/teamleader/team/members", {
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
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{team.name}</h1>
                            {team.description && (
                                <p className="text-gray-600 mt-1">{team.description}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2">
                                <span className="text-sm text-gray-500">
                                    {team.department?.name && `Department: ${team.department.name}`}
                                </span>
                                <span className="text-sm text-gray-500">
                                    {team.members.length} Members
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => setShowAddMemberModal(true)}
                                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <UserPlus className="h-4 w-4 mr-2" />
                                Add Member
                            </button>
                            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                                <Settings className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                    
                    {/* Tabs */}
                    <div className="flex space-x-8 mt-6">
                        {["overview", "members", "tasks", "projects", "activity"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`pb-4 px-1 capitalize ${
                                    activeTab === tab
                                        ? "text-blue-600 border-b-2 border-blue-600 font-medium"
                                        : "text-gray-500 hover:text-gray-700"
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
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">Team Members</p>
                                        <p className="text-2xl font-bold text-gray-900 mt-1">{team.members.length}</p>
                                    </div>
                                    <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <Users className="h-6 w-6 text-blue-600" />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">Completed Tasks</p>
                                        <p className="text-2xl font-bold text-gray-900 mt-1">{completedTasks}</p>
                                    </div>
                                    <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">In Progress</p>
                                        <p className="text-2xl font-bold text-gray-900 mt-1">{inProgressTasks}</p>
                                    </div>
                                    <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                                        <Clock className="h-6 w-6 text-yellow-600" />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">Pending Tasks</p>
                                        <p className="text-2xl font-bold text-gray-900 mt-1">{pendingTasks}</p>
                                    </div>
                                    <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                                        <AlertCircle className="h-6 w-6 text-red-600" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Team Members */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                            <div className="px-6 py-4 border-b">
                                <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
                            </div>
                            <div className="divide-y">
                                {memberList.map((member: any) => (
                                    <div key={member.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                                                {member.user.fullName.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{member.user.fullName}</p>
                                                <p className="text-sm text-gray-500">{member.user.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                member.role === "LEADER" 
                                                    ? "bg-purple-100 text-purple-800" 
                                                    : "bg-gray-100 text-gray-800"
                                            }`}>
                                                {member.role}
                                            </span>
                                            <button className="text-gray-400 hover:text-gray-600">
                                                <MoreVertical className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        {/* Recent Tasks */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                            <div className="px-6 py-4 border-b flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-900">Recent Tasks</h2>
                                <Link href="/teamleader/tasks" className="text-sm text-blue-600 hover:text-blue-800">
                                    View All
                                </Link>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {projects.map((project: any) => (
                            <div key={project.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="p-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-bold text-gray-900">{project.name}</h3>
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                                            project.status === "COMPLETED" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                                        }`}>
                                            {project.status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">{project.code}</p>
                                    <p className="text-gray-600 mt-4 line-clamp-2">{project.description}</p>
                                    
                                    <div className="mt-6 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium">
                                                {project.projectManager?.fullName.charAt(0)}
                                            </div>
                                            <span className="text-sm text-gray-600">{project.projectManager?.fullName}</span>
                                        </div>
                                        <Link 
                                            href={`/teamleader/projects/${project.id}`}
                                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                                        >
                                            View Details
                                        </Link>
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-6 py-3 border-t">
                                    <div className="flex items-center justify-between text-sm text-gray-500">
                                        <span>Progress</span>
                                        <span>{project.progress}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                                        <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${project.progress}%` }}></div>
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