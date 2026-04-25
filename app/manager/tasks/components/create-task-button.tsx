"use client";

import { useState, useEffect } from "react";
import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface CreateTaskButtonProps {
  projects: {
    id: string;
    name: string;
    code: string | null;
  }[];
  teamMembers: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
  }[];
  teamLeadId: string;
}

export function CreateTaskButton({ projects, teamMembers, teamLeadId }: CreateTaskButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dynamicTeamMembers, setDynamicTeamMembers] = useState(teamMembers);
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    projectId: "",
    assignedToId: "",
    priority: "MEDIUM",
    status: "TODO",
    type: "TASK",
    dueDate: "",
    estimatedHours: "",
  });

  useEffect(() => {
    const fetchProjectMembers = async () => {
      if (!formData.projectId) {
        setDynamicTeamMembers(teamMembers);
        return;
      }

      try {
        const response = await fetch(`/api/manager/team/members?projectId=${formData.projectId}`);
        if (response.ok) {
          const data = await response.json();
          setDynamicTeamMembers(data.data || []);
        }
      } catch (error) {
        console.error("Error fetching project members:", error);
      }
    };

    fetchProjectMembers();
  }, [formData.projectId, teamMembers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/manager/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : null,
          createdById: teamLeadId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create task");
      }

      // Reset form and close modal
      setFormData({
        title: "",
        description: "",
        projectId: "",
        assignedToId: "",
        priority: "MEDIUM",
        status: "TODO",
        type: "TASK",
        dueDate: "",
        estimatedHours: "",
      });
      setIsOpen(false);
      
      // Refresh the page to show new task
      router.refresh();
    } catch (error) {
      console.error("Error creating task:", error);
      alert(error instanceof Error ? error.message : "Failed to create task. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      // Reset assignee if project changes
      if (name === "projectId") {
        newData.assignedToId = "";
      }
      return newData;
    });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Plus className="w-5 h-5 mr-2" />
        Create New Task
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setIsOpen(false)}
            />

            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Create New Task</h3>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Title */}
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      required
                      value={formData.title}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter task title"
                    />
                  </div>

                  {/* Description */}
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter task description"
                    />
                  </div>

                  {/* Project Selection */}
                  <div>
                    <label htmlFor="projectId" className="block text-sm font-medium text-gray-700 mb-1">
                      Project *
                    </label>
                    <select
                      id="projectId"
                      name="projectId"
                      required
                      value={formData.projectId}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select a project</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name} {project.code ? `(${project.code})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Assignee Selection */}
                  <div>
                    <label htmlFor="assignedToId" className="block text-sm font-medium text-gray-700 mb-1">
                      Assign To
                    </label>
                    <select
                      id="assignedToId"
                      name="assignedToId"
                      value={formData.assignedToId}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Unassigned</option>
                      {dynamicTeamMembers.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.fullName} ({member.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Priority and Type */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                        Priority *
                      </label>
                      <select
                        id="priority"
                        name="priority"
                        required
                        value={formData.priority}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="URGENT">Urgent</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                        Type *
                      </label>
                      <select
                        id="type"
                        name="type"
                        required
                        value={formData.type}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="TASK">Task</option>
                        <option value="BUG">Bug</option>
                        <option value="FEATURE">Feature</option>
                        <option value="IMPROVEMENT">Improvement</option>
                      </select>
                    </div>
                  </div>

                  {/* Due Date and Estimated Hours */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
                        Due Date
                      </label>
                      <input
                        type="date"
                        id="dueDate"
                        name="dueDate"
                        value={formData.dueDate}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="estimatedHours" className="block text-sm font-medium text-gray-700 mb-1">
                        Estimated Hours
                      </label>
                      <input
                        type="number"
                        id="estimatedHours"
                        name="estimatedHours"
                        step="0.5"
                        min="0"
                        value={formData.estimatedHours}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., 2.5"
                      />
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? "Creating..." : "Create Task"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
