"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProject, deleteProject, archiveProject } from "../../actions";
import { User, Project } from "@prisma/client";

interface Props {
  project: any;
  managers: User[];
}

export function ProjectDetailClient({ project, managers }: Props) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: project.name,
    description: project.description || "",
    status: project.status,
    priority: project.priority,
    projectManagerId: project.projectManager?.id || "",
    startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : "",
    endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : "",
  });

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProject(project.id, {
        name: formData.name,
        description: formData.description,
        status: formData.status,
        priority: formData.priority,
        projectManagerId: formData.projectManagerId || null,
        startDate: formData.startDate ? new Date(formData.startDate) : null,
        endDate: formData.endDate ? new Date(formData.endDate) : null,
      });
      setIsEditing(false);
    } catch (e) {
      alert("Failed to update project");
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async () => {
    if(confirm("Archive this project? It will be marked as Completed.")) {
      await archiveProject(project.id);
    }
  };

  const handleDelete = async () => {
    if(confirm("Permanently delete this project? This action cannot be undone.")) {
      await deleteProject(project.id);
      router.push("/admin/projects");
    }
  };

  return (
    <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl shadow-sm border border-gray-100 dark:border-[#1a1a1a] p-8 mt-6 relative">
      <div className="flex justify-end gap-3 mb-6 absolute top-8 right-8">
        {!isEditing ? (
          <>
            <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-blue-100 transition-colors">Edit</button>
            <button onClick={handleArchive} className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-emerald-100 transition-colors">Archive</button>
            <button onClick={handleDelete} className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-red-100 transition-colors">Delete</button>
          </>
        ) : (
          <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors">Cancel</button>
        )}
      </div>

      {!isEditing ? (
        <div className="space-y-6">
          <div>
            <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-3 uppercase tracking-tighter italic">{project.name}</h2>
            <p className="text-lg font-medium text-gray-600 dark:text-gray-400 leading-relaxed">{project.description || "No description provided."}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-gray-100 dark:border-gray-800">
            <div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Status</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{project.status}</p>
            </div>
            <div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Priority</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{project.priority}</p>
            </div>
            <div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Timeline</p>
              <p className="text-base font-bold text-gray-900 dark:text-white">
                {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'TBD'} - 
                {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'TBD'}
              </p>
            </div>
            <div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Project Manager</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {project.projectManager ? project.projectManager.fullName : "Unassigned"}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleUpdate} className="space-y-6 mt-12">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Project Name</label>
            <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 shadow-sm" />
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Description</label>
            <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 shadow-sm" rows={3}></textarea>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Assign Project Manager</label>
              <select value={formData.projectManagerId} onChange={e => setFormData({...formData, projectManagerId: e.target.value})} className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 shadow-sm appearance-none">
                <option value="">Unassigned</option>
                {managers.map(user => (
                  <option key={user.id} value={user.id}>{user.fullName} ({user.email})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Status</label>
              <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 shadow-sm appearance-none">
                <option value="PLANNING">Planning</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Priority</label>
              <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 shadow-sm appearance-none">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Start Date</label>
                  <input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 shadow-sm" />
               </div>
               <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">End Date</label>
                  <input type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 shadow-sm" />
               </div>
            </div>
          </div>
          
          <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all">
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </form>
      )}
    </div>
  );
}
