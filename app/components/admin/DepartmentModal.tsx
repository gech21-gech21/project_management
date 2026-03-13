// components/admin/DepartmentModal.tsx
"use client";

import { useState, useEffect } from "react";

interface DepartmentModalProps {
  department?: {
    id: string;
    name: string;
    code: string | null;
    description: string | null;
    managerId?: string | null; // Changed from headId to managerId to match schema
  } | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

interface Team {
  id: string;
  name: string;
  description: string | null;
  teamLeadId: string | null;
  departmentId: string;
  teamLead?: {
    id: string;
    fullName: string;
    email: string;
  } | null;
  _count?: {
    members: number;
  };
}

export default function DepartmentModal({ department, onClose, onSuccess }: DepartmentModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    managerId: "", // Changed from headId to managerId
  });

  // Team management state
  const [teams, setTeams] = useState<Team[]>([]);
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [teamFormData, setTeamFormData] = useState({
    name: "",
    description: "",
    teamLeadId: "",
  });
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [teamLoading, setTeamLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teamError, setTeamError] = useState<string | null>(null);
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "teams">("details");

  useEffect(() => {
    fetchUsers();
    
    if (department) {
      setFormData({
        name: department.name || "",
        code: department.code || "",
        description: department.description || "",
        managerId: department.managerId || "", // Changed from headId to managerId
      });
      // Fetch teams for this department
      if (department.id) {
        fetchDepartmentTeams(department.id);
      }
    }
  }, [department]);

  const fetchDepartmentTeams = async (departmentId: string) => {
    try {
      console.log("Fetching teams for department:", departmentId);
      const response = await fetch(`/api/admin/departments/${departmentId}/teams`);
      
      if (!response.ok) {
        // If endpoint doesn't exist, handle gracefully
        if (response.status === 404) {
          console.log("Teams endpoint not found - teams feature may not be implemented yet");
          setTeams([]);
          return;
        }
        throw new Error("Failed to fetch teams");
      }
      
      const data = await response.json();
      setTeams(data.data || []);
    } catch (error) {
      console.error("Failed to fetch department teams:", error);
      // Don't show error to user, just set empty teams
      setTeams([]);
    }
  };

  const fetchUsers = async () => {
    setFetchingUsers(true);
    try {
      const response = await fetch("/api/admin/users?limit=100");
      if (response.ok) {
        const data = await response.json();
        setUsers(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setFetchingUsers(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = department
        ? `/api/admin/departments/${department.id}`
        : "/api/admin/departments";
      
      const method = department ? "PUT" : "POST";

      // Log the data being sent
      console.log("Submitting department data:", formData);

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save department");
      }

      console.log("Department saved successfully:", data);
      onSuccess();
    } catch (err) {
      console.error("Error saving department:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!department) return;
    
    setTeamLoading(true);
    setTeamError(null);

    try {
      // First check if teams API exists
      const testResponse = await fetch("/api/admin/teams", { method: "HEAD" });
      if (testResponse.status === 404) {
        setTeamError("Teams management is not available. Please contact administrator.");
        return;
      }

      const url = editingTeam
        ? `/api/admin/teams/${editingTeam.id}`
        : "/api/admin/teams";
      
      const method = editingTeam ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...teamFormData,
          departmentId: department.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save team");
      }

      // Reset team form and refresh teams list
      setTeamFormData({ name: "", description: "", teamLeadId: "" });
      setEditingTeam(null);
      setShowTeamForm(false);
      fetchDepartmentTeams(department.id);
    } catch (err) {
      console.error("Error saving team:", err);
      setTeamError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setTeamLoading(false);
    }
  };

  const handleEditTeam = (team: Team) => {
    setEditingTeam(team);
    setTeamFormData({
      name: team.name,
      description: team.description || "",
      teamLeadId: team.teamLeadId || "",
    });
    setShowTeamForm(true);
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm("Are you sure you want to delete this team? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/teams/${teamId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete team");
      }

      fetchDepartmentTeams(department!.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete team");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTeamFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTeamFormData(prev => ({ ...prev, [name]: value }));
  };

  const getTeamLeads = () => {
    return users.filter(user => user.role === "TEAMLEADER" || user.role === "ADMIN");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {department ? "Edit Department" : "Create Department"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          {department && (
            <div className="flex border-b border-gray-200 mb-6">
              <button
                onClick={() => setActiveTab("details")}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === "details"
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Department Details
              </button>
              <button
                onClick={() => setActiveTab("teams")}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === "teams"
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Teams ({teams.length})
              </button>
            </div>
          )}

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Department Details Tab */}
          {activeTab === "details" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Department Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Engineering"
                />
              </div>

              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                  Department Code
                </label>
                <input
                  type="text"
                  id="code"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., ENG"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter department description..."
                />
              </div>

              <div>
                <label htmlFor="managerId" className="block text-sm font-medium text-gray-700 mb-1">
                  Department Head
                </label>
                <select
                  id="managerId"
                  name="managerId"
                  value={formData.managerId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={fetchingUsers}
                >
                  <option value="">Select a department head</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.fullName} ({user.email}) - {user.role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Saving..." : department ? "Update Department" : "Create Department"}
                </button>
              </div>
            </form>
          )}

          {/* Teams Tab */}
          {activeTab === "teams" && department && (
            <div className="space-y-6">
              {/* Add Team Button */}
              {!showTeamForm && (
                <button
                  onClick={() => {
                    setEditingTeam(null);
                    setTeamFormData({ name: "", description: "", teamLeadId: "" });
                    setShowTeamForm(true);
                  }}
                  className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Add New Team
                </button>
              )}

              {/* Team Form */}
              {showTeamForm && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {editingTeam ? "Edit Team" : "Create New Team"}
                  </h3>
                  
                  {teamError && (
                    <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-600">{teamError}</p>
                    </div>
                  )}

                  <form onSubmit={handleTeamSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Team Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={teamFormData.name}
                        onChange={handleTeamFormChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Frontend Development"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        name="description"
                        value={teamFormData.description}
                        onChange={handleTeamFormChange}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Describe the team's purpose..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Team Lead
                      </label>
                      <select
                        name="teamLeadId"
                        value={teamFormData.teamLeadId}
                        onChange={handleTeamFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select a team lead</option>
                        {getTeamLeads().map(user => (
                          <option key={user.id} value={user.id}>
                            {user.fullName} ({user.email})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setShowTeamForm(false);
                          setEditingTeam(null);
                          setTeamError(null);
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={teamLoading}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {teamLoading ? "Saving..." : editingTeam ? "Update Team" : "Create Team"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Teams List */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700">Department Teams</h4>
                
                {teams.length > 0 ? (
                  teams.map((team) => (
                    <div
                      key={team.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900">{team.name}</h5>
                          {team.description && (
                            <p className="text-sm text-gray-600 mt-1">{team.description}</p>
                          )}
                          {team.teamLead && (
                            <p className="text-xs text-gray-500 mt-2">
                              Team Lead: {team.teamLead.fullName}
                            </p>
                          )}
                          {team._count && (
                            <p className="text-xs text-gray-500">
                              {team._count.members} members
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleEditTeam(team)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Edit team"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteTeam(team.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete team"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="text-gray-500">No teams created for this department yet.</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Click "Add New Team" to create your first team.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}