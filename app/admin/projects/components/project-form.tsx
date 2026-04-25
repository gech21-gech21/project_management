// admin/projects/components/project-form.tsx
"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface User {
  id: string;
  name: string | null;
  fullName?: string | null;
  email: string;
  role: string;
}


interface Team {
  id: string;
  name: string;
  description: string | null;
  departmentId: string | null;
  teamLeadId: string | null;
  department?: {
    id: string;
    name: string;
  } | null;
  teamLead?: {
    id: string;
    fullName: string;
    email: string;
  } | null;
  _count?: {
    members: number;
  };
}

interface ProjectFormProps {
  onSubmit: (data: any) => Promise<void>;
  onClose: () => void;
  isLoading: boolean;
  initialData?: any | null;
}

export function ProjectForm({ onSubmit, onClose, isLoading, initialData }: ProjectFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "PLANNING",
    priority: "MEDIUM",
    startDate: "",
    endDate: "",
    budget: "",
    teamId: "", // New field for team selection
    projectManagerId: "",
  });

  const [teamLeads, setTeamLeads] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState({
    teamLeads: false,
    teams: false,
  });
  const [fetchError, setFetchError] = useState({
    teamLeads: "",
    teams: "",
  });

  // Initialize form with initial data if editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        description: initialData.description || "",
        status: initialData.status || "PLANNING",
        priority: initialData.priority || "MEDIUM",
        startDate: initialData.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : "",
        endDate: initialData.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : "",
        budget: initialData.budget?.toString() || "",
        teamId: initialData.teamId || "",
        projectManagerId: initialData.projectManagerId || "",
      });
    }
  }, [initialData]);

  // Fetch team leads (users with PROJECT_MANAGER role)
  useEffect(() => {
    const fetchTeamLeads = async () => {
      setLoading(prev => ({ ...prev, teamLeads: true }));
      setFetchError(prev => ({ ...prev, teamLeads: "" }));

      try {
        const response = await fetch("/api/admin/users?limit=100");

        if (!response.ok) {
          throw new Error(`Failed to fetch team leads: ${response.statusText}`);
        }

        const data = await response.json();
        // Normalize response: API may return an array or an object containing the array
        const usersArray: any[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.users)
            ? data.users
            : Array.isArray(data?.data)
              ? data.data
              : [];

        // Filter to ensure only users with PROJECT_MANAGER role are included
        const filteredTeamLeads = usersArray.filter((user: User) => user?.role === "PROJECT_MANAGER");
        setTeamLeads(filteredTeamLeads);
      } catch (error) {
        console.error("Error fetching team leads:", error);
        setFetchError(prev => ({
          ...prev,
          teamLeads: "Failed to load team leads. Please try again."
        }));
      } finally {
        setLoading(prev => ({ ...prev, teamLeads: false }));
      }
    };

    fetchTeamLeads();
  }, []);


  // Fetch teams
  useEffect(() => {
    const fetchTeams = async () => {
      setLoading(prev => ({ ...prev, teams: true }));
      setFetchError(prev => ({ ...prev, teams: "" }));

      try {
        const response = await fetch("/api/admin/teams?limit=100");

        if (!response.ok) {
          throw new Error(`Failed to fetch teams: ${response.statusText}`);
        }

        const data = await response.json();
        // Normalize response
        const teamsArray: any[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.teams)
            ? data.teams
            : Array.isArray(data?.data)
              ? data.data
              : [];

        setTeams(teamsArray);
      } catch (error) {
        console.error("Error fetching teams:", error);
        setFetchError(prev => ({
          ...prev,
          teams: "Failed to load teams. Please try again."
        }));
      } finally {
        setLoading(prev => ({ ...prev, teams: false }));
      }
    };

    fetchTeams();
  }, []);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Format the data for API submission
      if (!formData.projectManagerId) {
        alert('Please select a Team Lead (project manager) before creating the project.');
        return;
      }

      if (!formData.startDate || !formData.endDate) {
        alert('Please provide both start and end dates for the project.');
        return;
      }

      const formattedData = {
        name: formData.name,
        description: formData.description || "",
        status: formData.status,
        priority: formData.priority,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        projectManagerId: formData.projectManagerId || null,
        teamId: formData.teamId || null, // Include team selection
      };

      await onSubmit(formattedData);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (field: 'startDate' | 'endDate', dateString: string) => {
    if (dateString) {
      setFormData(prev => ({
        ...prev,
        [field]: dateString
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Get display name for user
  const getUserDisplayName = (user: User): string => {
    const displayName = user.fullName || user.name || user.email;
    return displayName;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {initialData ? "Edit Project" : "Create New Project"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Project Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Project Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="PLANNING">Planning</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Priority
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Date
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={(e) => handleDateChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Date
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={(e) => handleDateChange('endDate', e.target.value)}
                min={formData.startDate}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Budget */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Budget
            </label>
            <input
              type="number"
              name="budget"
              value={formData.budget}
              onChange={handleChange}
              min="0"
              step="0.01"
              placeholder="0.00"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>


          {/* Team Selection - New Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Team
            </label>
            <select
              name="teamId"
              value={formData.teamId}
              onChange={handleChange}
              disabled={loading.teams}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Select a team</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name} 
                  {team.department ? ` (${team.department.name})` : ''}
                  {team._count?.members ? ` - ${team._count.members} members` : ''}
                </option>
              ))}
            </select>
            {loading.teams && (
              <p className="text-sm text-gray-500 mt-1">Loading teams...</p>
            )}
            {fetchError.teams && (
              <p className="text-sm text-red-500 mt-1">{fetchError.teams}</p>
            )}
          </div>

          {/* Team Lead Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Project Manager (Team Lead) *
            </label>
            <select
              name="projectManagerId"
              value={formData.projectManagerId}
              onChange={handleChange}
              disabled={loading.teamLeads}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Select a project manager</option>
              {teamLeads.map((lead) => (
                <option key={lead.id} value={lead.id}>
                  {getUserDisplayName(lead)}
                </option>
              ))}
            </select>
            {loading.teamLeads && (
              <p className="text-sm text-gray-500 mt-1">Loading team leads...</p>
            )}
            {fetchError.teamLeads && (
              <p className="text-sm text-red-500 mt-1">{fetchError.teamLeads}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Only users with Team Leader role are shown
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || loading.teamLeads || loading.teams}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading 
                ? (initialData ? "Updating..." : "Creating...") 
                : (initialData ? "Update Project" : "Create Project")
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
