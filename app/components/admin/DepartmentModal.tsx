// components/admin/DepartmentModal.tsx
"use client";

import { useState, useEffect } from "react";
import { X, Plus, Edit2, Trash2, Users, ShieldCheck, ChevronDown } from "lucide-react";

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
    return users.filter(user => user.role === "PROJECT_MANAGER" || user.role === "ADMIN");
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-[#0a0a0a] rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-gray-100 dark:border-white/10 shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="p-8 h-full overflow-y-auto custom-scrollbar">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">
              {department ? "Edit" : "Create"} <span className="text-blue-600">Department</span>
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Tabs */}
          {department && (
            <div className="flex gap-2 border-b border-gray-100 dark:border-white/5 mb-8">
              <button
                onClick={() => setActiveTab("details")}
                className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === "details"
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                }`}
              >
                Department Details
              </button>
              <button
                onClick={() => setActiveTab("teams")}
                className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === "teams"
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                }`}
              >
                Teams ({teams.length})
              </button>
            </div>
          )}

          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-xl p-4">
              <p className="text-sm font-bold text-red-600 dark:text-red-400 uppercase tracking-tight">{error}</p>
            </div>
          )}

          {/* Department Details Tab */}
          {activeTab === "details" && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                    Department Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium text-gray-900 dark:text-white"
                    placeholder="e.g., Engineering"
                  />
                </div>

                <div>
                  <label htmlFor="code" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                    Department Code
                  </label>
                  <input
                    type="text"
                    id="code"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium text-gray-900 dark:text-white"
                    placeholder="e.g., ENG"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium text-gray-900 dark:text-white"
                  placeholder="Enter department description..."
                />
              </div>

              <div>
                <label htmlFor="managerId" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                  Department Head
                </label>
                <div className="relative">
                  <select
                    id="managerId"
                    name="managerId"
                    value={formData.managerId}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-bold text-gray-900 dark:text-white appearance-none cursor-pointer"
                    disabled={fetchingUsers}
                  >
                    <option value="">Select a department head</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.fullName} ({user.email}) - {user.role}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <ChevronDown size={16} />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-4 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-900 dark:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all text-[10px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(37,99,235,0.2)] disabled:opacity-50"
                >
                  {loading ? "Saving..." : department ? "Update Node" : "Deploy Node"}
                </button>
              </div>
            </form>
          )}

          {/* Teams Tab */}
          {activeTab === "teams" && department && (
            <div className="space-y-8">
              {/* Add Team Button */}
              {!showTeamForm && (
                <button
                  onClick={() => {
                    setEditingTeam(null);
                    setTeamFormData({ name: "", description: "", teamLeadId: "" });
                    setShowTeamForm(true);
                  }}
                  className="w-full px-6 py-8 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-3xl text-gray-400 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all flex flex-col items-center justify-center gap-3 group"
                >
                  <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-2xl group-hover:bg-blue-50 dark:group-hover:bg-blue-500/10 transition-colors">
                    <Plus size={24} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Initialize New Unit</span>
                </button>
              )}

              {/* Team Form */}
              {showTeamForm && (
                <div className="bg-gray-50 dark:bg-white/[0.02] rounded-3xl p-8 border border-gray-100 dark:border-white/5 animate-in slide-in-from-top-4 duration-300">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">
                      {editingTeam ? "Edit" : "New"} <span className="text-blue-600">Unit Assignment</span>
                    </h3>
                    <button 
                      onClick={() => setShowTeamForm(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  
                  {teamError && (
                    <div className="mb-6 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-xl p-4">
                      <p className="text-sm font-bold text-red-600 dark:text-red-400 uppercase tracking-tight">{teamError}</p>
                    </div>
                  )}

                  <form onSubmit={handleTeamSubmit} className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                        Unit Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={teamFormData.name}
                        onChange={handleTeamFormChange}
                        required
                        className="w-full px-4 py-3 bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium text-gray-900 dark:text-white"
                        placeholder="e.g., Frontend Development"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                        Operational Description
                      </label>
                      <textarea
                        name="description"
                        value={teamFormData.description}
                        onChange={handleTeamFormChange}
                        rows={2}
                        className="w-full px-4 py-3 bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium text-gray-900 dark:text-white"
                        placeholder="Describe the unit's primary objectives..."
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                        Unit Commander
                      </label>
                      <div className="relative">
                        <select
                          name="teamLeadId"
                          value={teamFormData.teamLeadId}
                          onChange={handleTeamFormChange}
                          className="w-full px-4 py-3 bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-bold text-gray-900 dark:text-white appearance-none cursor-pointer"
                        >
                          <option value="">Select a command lead</option>
                          {getTeamLeads().map(user => (
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

                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowTeamForm(false);
                          setEditingTeam(null);
                          setTeamError(null);
                        }}
                        className="flex-1 px-6 py-4 bg-white dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-900 dark:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-gray-200 dark:border-white/10"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={teamLoading}
                        className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all text-[10px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(37,99,235,0.2)] disabled:opacity-50"
                      >
                        {teamLoading ? "Deploying..." : editingTeam ? "Update Unit" : "Initialize Unit"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Teams List */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <ShieldCheck size={12} className="text-blue-500" />
                  Active Department Units
                </h4>
                
                {teams.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {teams.map((team) => (
                      <div
                        key={team.id}
                        className="bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-2xl p-6 hover:bg-white dark:hover:bg-white/[0.05] transition-all group/team"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h5 className="font-black text-gray-900 dark:text-white uppercase tracking-tight group-hover/team:text-blue-600 transition-colors">{team.name}</h5>
                            {team.description && (
                              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-2 line-clamp-1">{team.description}</p>
                            )}
                            <div className="mt-4 flex flex-wrap gap-4">
                              {team.teamLead && (
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                    <ShieldCheck size={12} className="text-blue-600 dark:text-blue-400" />
                                  </div>
                                  <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Lead: {team.teamLead.fullName}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-gray-500/10 flex items-center justify-center">
                                  <Users size={12} className="text-gray-500" />
                                </div>
                                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{team._count?.members || 0} Personnel</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4 opacity-0 group-hover/team:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEditTeam(team)}
                              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-all"
                              title="Edit team"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteTeam(team.id)}
                              className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all"
                              title="Delete team"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 dark:bg-white/[0.02] rounded-3xl border border-dashed border-gray-200 dark:border-white/10">
                    <Users className="w-12 h-12 mx-auto text-gray-300 dark:text-white/10 mb-4" />
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No Active Units Detected</p>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-500 mt-2">
                      Initialize unit assignments to map personnel hierarchy.
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
