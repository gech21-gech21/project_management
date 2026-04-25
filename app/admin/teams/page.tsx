//admin/teams/page.tsx
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { Users, Plus, AlertCircle, Search, UserPlus, Edit2, Trash2, FolderKanban, Clock, ShieldCheck, X, ChevronDown } from "lucide-react";

interface Team {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  teamLead: {
    id: string;
    fullName: string;
    email: string;
    username: string;
    avatarUrl: string | null;
  } | null;
  department: {
    id: string;
    name: string;
    code: string | null;
  } | null;
  members: TeamMember[];
  _count?: {
    members: number;
  };
}

interface TeamMember {
  id: string;
  role: string;
  joinedAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    username: string;
    avatarUrl: string | null;
    role: string;
  };
}

interface User {
  id: string;
  fullName: string;
  email: string;
  username: string;
  avatarUrl: string | null;
  role: string;
  department?: {
    id: string;
    name: string;
  } | null;
}

interface Department {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
}

export default function AdminTeamsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    departmentId: "",
    teamLeadId: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await Promise.all([fetchTeams(), fetchDepartments(), fetchUsers()]);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []); // Add dependencies if needed

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

    fetchData();
  }, [session, status, router, fetchData]);

  const fetchTeams = async () => {
    try {
      const response = await fetch("/api/admin/teams");
      if (response.ok) {
        const data = await response.json();
        setTeams(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching teams:", error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch("/api/admin/departments?limit=100");
      if (response.ok) {
        const data = await response.json();
        setDepartments(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users?limit=100");
      if (response.ok) {
        const data = await response.json();
        setUsers(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await fetch("/api/admin/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setShowCreateModal(false);
        resetForm();
        fetchTeams();
      } else {
        setError(data.error || "Failed to create team");
      }
    } catch (err) {
      console.error("Error creating team:", err);
      setError("Failed to create team");
    }
  };

  const handleUpdateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam) return;
    setError(null);

    try {
      const response = await fetch(`/api/admin/teams/${selectedTeam.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setShowEditModal(false);
        setSelectedTeam(null);
        resetForm();
        fetchTeams();
      } else {
        setError(data.error || "Failed to update team");
      }
    } catch (err) {
      console.error("Error updating team:", err);
      setError("Failed to update team");
    }
  };

  const handleDeleteTeam = async (teamId: string, teamName: string) => {
    if (
      !confirm(
        `Are you sure you want to delete team "${teamName}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/teams/${teamId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchTeams();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to delete team");
      }
    } catch (err) {
      console.error("Error deleting team:", err);
      alert("Failed to delete team");
    }
  };

  const handleAddMember = async (userId: string) => {
    if (!selectedTeam) return;

    try {
      const response = await fetch(
        `/api/admin/teams/${selectedTeam.id}/members`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId, role: "MEMBER" }),
        },
      );

      if (response.ok) {
        setShowAddMemberModal(false);
        setSelectedTeam(null);
        fetchTeams();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to add member");
      }
    } catch (err) {
      console.error("Error adding member:", err);
      alert("Failed to add member");
    }
  };

  const handleRemoveMember = async (teamId: string, memberId: string) => {
    if (
      !confirm("Are you sure you want to remove this member from the team?")
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/teams/${teamId}/members/${memberId}`,
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        fetchTeams();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to remove member");
      }
    } catch (err) {
      console.error("Error removing member:", err);
      alert("Failed to remove member");
    }
  };

  const handleUpdateMemberRole = async (
    teamId: string,
    memberId: string,
    newRole: string,
  ) => {
    try {
      const response = await fetch(
        `/api/admin/teams/${teamId}/members/${memberId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ role: newRole }),
        },
      );

      if (response.ok) {
        fetchTeams();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to update member role");
      }
    } catch (err) {
      console.error("Error updating member role:", err);
      alert("Failed to update member role");
    }
  };

  const openEditModal = (team: Team) => {
    setSelectedTeam(team);
    setFormData({
      name: team.name,
      description: team.description || "",
      departmentId: team.department?.id || "",
      teamLeadId: team.teamLead?.id || "",
    });
    setShowEditModal(true);
  };

  const openAddMemberModal = (team: Team) => {
    setSelectedTeam(team);
    setShowAddMemberModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      departmentId: "",
      teamLeadId: "",
    });
    setError(null);
  };

  const filteredTeams = teams.filter((team) => {
    const matchesSearch =
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (team.description?.toLowerCase() || "").includes(
        searchTerm.toLowerCase(),
      );
    const matchesDepartment =
      !selectedDepartment || team.department?.id === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  const getAvailableUsers = () => {
    if (!selectedTeam) return [];
    const memberIds = selectedTeam.members.map((m) => m.user.id);
    return users.filter((user) => !memberIds.includes(user.id));
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "LEADER":
        return "bg-purple-100 text-purple-800";
      case "MEMBER":
        return "bg-blue-100 text-blue-800";
      case "GUEST":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex items-center justify-center transition-colors duration-300">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] animate-pulse">Scanning Neural Network...</p>
        </div>
      </div>
    );
  }

  if (!session?.user || session.user.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-100 dark:border-white/5 pb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-blue-500/10 rounded-lg">
                <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em]">Personnel Logistics</span>
            </div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic">
              Teams <span className="text-blue-600">Management</span>
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium">
              Create and manage team structures, assign leadership nodes, and aggregate personnel.
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2 text-xs font-black uppercase tracking-widest shadow-[0_0_20px_rgba(37,99,235,0.2)] hover:shadow-[0_0_30px_rgba(37,99,235,0.4)]"
          >
            <Plus size={16} />
            Create New Team
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-xl p-4 animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <p className="text-sm font-bold text-red-600 dark:text-red-400 uppercase tracking-tight">{error}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 dark:bg-white/[0.02] p-4 rounded-2xl border border-gray-100 dark:border-white/5">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={16} />
            <input
              type="text"
              placeholder="Search teams..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium text-gray-900 dark:text-white"
            />
          </div>
          <div className="relative">
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-bold text-gray-900 dark:text-white appearance-none"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name} {dept.code ? `(${dept.code})` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Teams Grid */}
        {filteredTeams.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {filteredTeams.map((team) => (
              <div
                key={team.id}
                className="glass-card rounded-3xl overflow-hidden group hover:scale-[1.01] transition-all duration-300"
              >
                {/* Team Header */}
                <div className="p-8 border-b border-gray-100 dark:border-white/5 relative">
                  <div className="flex justify-between items-start relative z-10">
                    <div>
                      <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic group-hover:text-blue-600 transition-colors">
                        {team.name}
                      </h2>
                      {team.description && (
                        <p className="mt-2 text-sm font-medium text-gray-500 dark:text-gray-400 line-clamp-2">
                          {team.description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openAddMemberModal(team)}
                        className="p-2.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-all"
                        title="Add Member"
                      >
                        <UserPlus size={18} />
                      </button>
                      <button
                        onClick={() => openEditModal(team)}
                        className="p-2.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-xl transition-all"
                        title="Edit Team"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteTeam(team.id, team.name)}
                        className="p-2.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all"
                        title="Delete Team"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    {team.department && (
                      <span className="px-3 py-1.5 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-[10px] font-black text-gray-500 dark:text-gray-400 rounded-lg uppercase tracking-widest flex items-center gap-2">
                        <FolderKanban size={12} className="opacity-50" />
                        {team.department.name}
                      </span>
                    )}
                    <span className="px-3 py-1.5 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-[10px] font-black text-blue-600 dark:text-blue-400 rounded-lg uppercase tracking-widest flex items-center gap-2">
                      <Users size={12} />
                      {team.members.length} personnel
                    </span>
                    <span className="px-3 py-1.5 bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20 text-[10px] font-black text-purple-600 dark:text-purple-400 rounded-lg uppercase tracking-widest flex items-center gap-2">
                      <Clock size={12} />
                      Deployed {new Date(team.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Team Lead */}
                {team.teamLead && (
                  <div className="px-8 py-5 bg-purple-50/50 dark:bg-purple-500/5 border-b border-purple-100 dark:border-purple-500/10 relative overflow-hidden">
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 p-[2px] shadow-lg">
                        <div className="w-full h-full rounded-full bg-white dark:bg-[#0a0a0a] flex items-center justify-center overflow-hidden">
                          <span className="text-lg font-black text-purple-600 dark:text-purple-400 uppercase">
                            {team.teamLead.fullName.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <ShieldCheck size={12} className="text-purple-600" />
                          <p className="text-[10px] text-purple-600 font-black uppercase tracking-widest">Team Commander</p>
                        </div>
                        <p className="font-bold text-gray-900 dark:text-white uppercase tracking-tight">
                          {team.teamLead.fullName}
                        </p>
                        <p className="text-[11px] font-mono text-gray-500 dark:text-gray-400 italic">
                          {team.teamLead.email}
                        </p>
                      </div>
                    </div>
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                      <ShieldCheck size={60} />
                    </div>
                  </div>
                )}

                {/* Team Members List */}
                <div className="p-8">
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                    <Users size={12} className="text-blue-500" />
                    Personnel Directory
                  </h3>
                  {team.members.length > 0 ? (
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {team.members.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between group/member p-3 rounded-2xl bg-gray-50/50 dark:bg-white/[0.02] border border-gray-100/50 dark:border-white/5 hover:bg-white dark:hover:bg-white/[0.05] transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center border border-gray-200 dark:border-white/10 group-hover/member:border-blue-500/50 transition-colors">
                              <span className="text-gray-600 dark:text-gray-400 font-black uppercase text-sm">
                                {member.user.fullName.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-tight group-hover/member:text-blue-600 transition-colors">
                                {member.user.fullName}
                              </p>
                              <p className="text-[10px] font-mono text-gray-400 uppercase">
                                @{member.user.username}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <select
                              value={member.role}
                              onChange={(e) =>
                                handleUpdateMemberRole(
                                  team.id,
                                  member.id,
                                  e.target.value,
                                )
                              }
                              className={`text-[9px] px-3 py-1.5 rounded-lg font-black uppercase tracking-widest border transition-all appearance-none cursor-pointer hover:scale-105 ${
                                member.role === 'LEADER' 
                                  ? 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20' 
                                  : 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20'
                              }`}
                            >
                              <option value="MEMBER">Member</option>
                              <option value="LEADER">Leader</option>
                              <option value="GUEST">Guest</option>
                            </select>
                            <button
                              onClick={() =>
                                handleRemoveMember(team.id, member.id)
                              }
                              className="opacity-0 group-hover/member:opacity-100 p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-gray-50/50 dark:bg-white/[0.02] rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        No personnel assigned to this node.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-[#0a0a0a] rounded-3xl shadow-sm p-20 text-center border border-gray-100 dark:border-white/5 border-dashed">
            <div className="text-6xl mb-6 grayscale opacity-20 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700">👥</div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-widest mb-2">
              No Teams Detected
            </h3>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
              Initialize your first organizational structure to begin personnel management and resource allocation.
            </p>
            <button
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
              className="px-8 py-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all inline-flex items-center gap-3 text-xs font-black uppercase tracking-widest shadow-[0_0_20px_rgba(37,99,235,0.2)]"
            >
              <Plus size={20} />
              Initialize First Team
            </button>
          </div>
        )}

        {/* Create Team Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-[#0a0a0a] rounded-3xl max-w-md w-full p-8 border border-gray-100 dark:border-white/10 shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">
                  Create <span className="text-blue-600">New Team</span>
                </h2>
                <button onClick={() => setShowCreateModal(false)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleCreateTeam} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                      Team Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium text-gray-900 dark:text-white"
                      placeholder="e.g., Alpha Squad"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                      Operational Objective
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      rows={3}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium text-gray-900 dark:text-white"
                      placeholder="Define the team's primary mission..."
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                        Department Node
                      </label>
                      <select
                        value={formData.departmentId}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            departmentId: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-bold text-gray-900 dark:text-white appearance-none"
                      >
                        <option value="">No Department</option>
                        {departments.map((dept) => (
                          <option key={dept.id} value={dept.id}>
                            {dept.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                        Team Commander
                      </label>
                      <select
                        value={formData.teamLeadId}
                        onChange={(e) =>
                          setFormData({ ...formData, teamLeadId: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-bold text-gray-900 dark:text-white appearance-none"
                      >
                        <option value="">Select Command Lead</option>
                        {users
                          .filter(
                            (u) => u.role === "PROJECT_MANAGER" || u.role === "ADMIN",
                          )
                          .map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.fullName} ({user.role})
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="pt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="flex-1 px-6 py-4 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-900 dark:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    Abort
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all text-[10px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(37,99,235,0.2)]"
                  >
                    Deploy Team
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Team Modal */}
        {showEditModal && selectedTeam && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-[#0a0a0a] rounded-3xl max-w-md w-full p-8 border border-gray-100 dark:border-white/10 shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">
                  Edit <span className="text-blue-600">Team Node</span>
                </h2>
                <button 
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedTeam(null);
                    resetForm();
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleUpdateTeam} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                      Team Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium text-gray-900 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                      Operational Objective
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      rows={3}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium text-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                        Department Node
                      </label>
                      <div className="relative">
                        <select
                          value={formData.departmentId}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              departmentId: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-bold text-gray-900 dark:text-white appearance-none cursor-pointer"
                        >
                          <option value="">No Department</option>
                          {departments.map((dept) => (
                            <option key={dept.id} value={dept.id}>
                              {dept.name}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                          <ChevronDown size={16} />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                        Team Commander
                      </label>
                      <div className="relative">
                        <select
                          value={formData.teamLeadId}
                          onChange={(e) =>
                            setFormData({ ...formData, teamLeadId: e.target.value })
                          }
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-bold text-gray-900 dark:text-white appearance-none cursor-pointer"
                        >
                          <option value="">Select Command Lead</option>
                          {users
                            .filter(
                              (u) => u.role === "PROJECT_MANAGER" || u.role === "ADMIN",
                            )
                            .map((user) => (
                              <option key={user.id} value={user.id}>
                                {user.fullName} ({user.role})
                              </option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                          <ChevronDown size={16} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedTeam(null);
                      resetForm();
                    }}
                    className="flex-1 px-6 py-4 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-900 dark:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    Abort
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all text-[10px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(37,99,235,0.2)]"
                  >
                    Update Node
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Member Modal */}
        {showAddMemberModal && selectedTeam && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-[#0a0a0a] rounded-3xl max-w-md w-full p-8 border border-gray-100 dark:border-white/10 shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">
                  Add <span className="text-blue-600">Personnel</span>
                </h2>
                <button 
                  onClick={() => {
                    setShowAddMemberModal(false);
                    setSelectedTeam(null);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                    Select Target Node
                  </label>
                  <div className="relative">
                    <select
                      onChange={(e) =>
                        e.target.value && handleAddMember(e.target.value)
                      }
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-bold text-gray-900 dark:text-white appearance-none cursor-pointer"
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Choose personnel...
                      </option>
                      {getAvailableUsers().map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.fullName} ({user.email})
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                      <ChevronDown size={16} />
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddMemberModal(false);
                      setSelectedTeam(null);
                    }}
                    className="w-full px-6 py-4 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-900 dark:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    Abort Assignment
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
