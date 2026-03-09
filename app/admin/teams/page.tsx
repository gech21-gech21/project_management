//admin/teams/page.tsx
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading teams...</p>
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
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Teams Management
            </h1>
            <p className="mt-2 text-gray-600">
              Create and manage teams, assign team leaders, and add members
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create New Team
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <input
              type="text"
              placeholder="Search teams..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredTeams.map((team) => (
              <div
                key={team.id}
                className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200"
              >
                {/* Team Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        {team.name}
                      </h2>
                      {team.description && (
                        <p className="mt-1 text-gray-600">{team.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openAddMemberModal(team)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Add Member"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => openEditModal(team)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Edit Team"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteTeam(team.id, team.name)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Team"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-4 text-sm">
                    {team.department && (
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full">
                        📁 {team.department.name}
                      </span>
                    )}
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                      👥 {team.members.length} members
                    </span>
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full">
                      🕒 Created {new Date(team.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Team Lead */}
                {team.teamLead && (
                  <div className="px-6 py-4 bg-purple-50 border-b border-purple-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-200 rounded-full flex items-center justify-center">
                        <span className="text-purple-700 font-medium">
                          {team.teamLead.fullName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-purple-600 font-medium">
                          Team Leader
                        </p>
                        <p className="font-medium text-gray-900">
                          {team.teamLead.fullName}
                        </p>
                        <p className="text-sm text-gray-600">
                          {team.teamLead.email}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Team Members */}
                <div className="p-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-4">
                    Team Members
                  </h3>
                  {team.members.length > 0 ? (
                    <div className="space-y-3">
                      {team.members.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                              <span className="text-gray-600 text-sm font-medium">
                                {member.user.fullName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {member.user.fullName}
                              </p>
                              <p className="text-xs text-gray-500">
                                @{member.user.username}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <select
                              value={member.role}
                              onChange={(e) =>
                                handleUpdateMemberRole(
                                  team.id,
                                  member.id,
                                  e.target.value,
                                )
                              }
                              className={`text-xs px-2 py-1 rounded-full font-medium ${getRoleBadgeColor(member.role)}`}
                            >
                              <option value="MEMBER">Member</option>
                              <option value="LEADER">Leader</option>
                              <option value="GUEST">Guest</option>
                            </select>
                            <button
                              onClick={() =>
                                handleRemoveMember(team.id, member.id)
                              }
                              className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">
                      No members in this team yet.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Teams Found
            </h3>
            <p className="text-gray-600 mb-6">
              Get started by creating your first team.
            </p>
            <button
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Create Your First Team
            </button>
          </div>
        )}

        {/* Create Team Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Create New Team
              </h2>

              <form onSubmit={handleCreateTeam}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Team Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department
                    </label>
                    <select
                      value={formData.departmentId}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          departmentId: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Team Leader
                    </label>
                    <select
                      value={formData.teamLeadId}
                      onChange={(e) =>
                        setFormData({ ...formData, teamLeadId: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Team Leader</option>
                      {users
                        .filter(
                          (u) => u.role === "TEAMLEADER" || u.role === "ADMIN",
                        )
                        .map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.fullName} ({user.email}) - {user.role}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="mt-6 flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Team
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Team Modal */}
        {showEditModal && selectedTeam && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Edit Team
              </h2>

              <form onSubmit={handleUpdateTeam}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Team Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department
                    </label>
                    <select
                      value={formData.departmentId}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          departmentId: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Team Leader
                    </label>
                    <select
                      value={formData.teamLeadId}
                      onChange={(e) =>
                        setFormData({ ...formData, teamLeadId: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Team Leader</option>
                      {users
                        .filter(
                          (u) => u.role === "TEAMLEADER" || u.role === "ADMIN",
                        )
                        .map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.fullName} ({user.email}) - {user.role}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="mt-6 flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedTeam(null);
                      resetForm();
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Update Team
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Member Modal */}
        {showAddMemberModal && selectedTeam && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Add Member to {selectedTeam.name}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select User
                  </label>
                  <select
                    onChange={(e) =>
                      e.target.value && handleAddMember(e.target.value)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Choose a user...
                    </option>
                    {getAvailableUsers().map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.fullName} ({user.email}) - {user.role}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-6 flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddMemberModal(false);
                      setSelectedTeam(null);
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
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
