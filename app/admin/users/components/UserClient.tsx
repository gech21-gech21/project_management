"use client";

import { useState } from "react";
import { UserCircle, Mail, Shield, UserPlus, Edit2, Trash2, X, MoreVertical } from "lucide-react";
import { createUser, updateUser, deleteUser } from "../actions";
import { useToast } from "@/app/providers/ToastProvider";

export function UserClient({ initialUsers, departments }: { initialUsers: any[], departments: any[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const { addToast } = useToast();

  // Form State
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    role: "TEAM_MEMBER",
    status: "ACTIVE",
    departmentId: ""
  });

  const [loading, setLoading] = useState(false);

  const openModal = (user: any = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        fullName: user.fullName || "",
        username: user.username || "",
        email: user.email || "",
        role: user.role || "TEAM_MEMBER",
        status: user.status || "ACTIVE",
        departmentId: user.departmentId || ""
      });
    } else {
      setEditingUser(null);
      setFormData({
        fullName: "",
        username: "",
        email: "",
        role: "TEAM_MEMBER",
        status: "ACTIVE",
        departmentId: ""
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        fullName: formData.fullName,
        email: formData.email,
        role: formData.role as any,
        status: formData.status as any,
        departmentId: formData.departmentId || null,
        ...(editingUser ? {} : { username: formData.username })
      };

      let result;
      if (editingUser) {
        result = await updateUser(editingUser.id, payload);
      } else {
        result = await createUser({ ...payload, username: formData.username });
      }

      if (result.success) {
        addToast({
          title: "Success",
          message: editingUser ? "User updated successfully" : "User deployed successfully",
          type: "SUCCESS"
        });
        // Instead of manual refresh, relying on revalidatePath
        // Small delay to allow toast to be seen? Actually window.location.reload() might be too fast.
        // But revalidatePath should handle it if it was a RSC reload.
        setTimeout(() => window.location.reload(), 500);
        closeModal();
      } else {
        addToast({
          title: "Error",
          message: result.error || "An error occurred",
          type: "ERROR"
        });
      }
    } catch (error) {
      console.error(error);
      addToast({
        title: "Critical Error",
        message: "An unexpected error occurred. Please try again.",
        type: "ERROR"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this user?")) {
      try {
        await deleteUser(id);
        window.location.reload();
      } catch(error) {
        alert("Failed to delete user");
      }
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center bg-white dark:bg-[#0a0a0a] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-[#1a1a1a]">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-widest">User Management</h1>
          <p className="text-sm font-bold text-gray-400 mt-1 uppercase tracking-widest">Directory of System Nodes</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)] hover:shadow-[0_0_30px_rgba(37,99,235,0.4)]"
        >
          <UserPlus size={16} />
          Add Personnel
        </button>
      </div>

      <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl shadow-sm border border-gray-100 dark:border-[#1a1a1a] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 dark:divide-[#1a1a1a]">
            <thead className="bg-gray-50/50 dark:bg-white/5">
              <tr>
                <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">User</th>
                <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Role</th>
                <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Status</th>
                <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Department</th>
                <th className="px-8 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#1a1a1a]">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors group px-4">
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-lg shadow-inner ${
                        user.role === 'ADMIN' ? 'bg-gradient-to-br from-purple-500 to-indigo-600' :
                        user.role === 'PROJECT_MANAGER' ? 'bg-gradient-to-br from-blue-500 to-cyan-600' :
                        'bg-gradient-to-br from-emerald-500 to-teal-600'
                      }`}>
                        {user.fullName ? user.fullName[0] : (user.email ? user.email[0].toUpperCase() : "?")}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm">{user.fullName}</h3>
                        <p className="text-[11px] text-gray-400 font-mono mt-0.5">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <span className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${
                      user.role === 'ADMIN' ? 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-500/10 dark:border-purple-500/20 dark:text-purple-400' :
                      user.role === 'PROJECT_MANAGER' ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400' :
                      'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400'
                    }`}>
                      {user.role.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-2">
                       <span className={`w-2 h-2 rounded-full ${user.status === 'ACTIVE' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-gray-400'}`}></span>
                       <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{user.status}</span>
                    </div>
                  </td>
                  <td className="px-8 py-4">
                     <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                        {user.department?.name || 'Unassigned'}
                     </span>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openModal(user)} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(user.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl shadow-xl border border-gray-100 dark:border-[#1a1a1a] w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 dark:border-[#1a1a1a] flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
              <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-widest">
                {editingUser ? "Edit User Node" : "Deploy New Node"}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Full Name</label>
                <input 
                  type="text" 
                  required
                  value={formData.fullName}
                  onChange={e => setFormData({...formData, fullName: e.target.value})}
                  className="w-full bg-gray-100/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all font-medium text-gray-900 dark:text-white" 
                />
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Username</label>
                  <input 
                    type="text" 
                    required
                    value={formData.username}
                    onChange={e => setFormData({...formData, username: e.target.value})}
                    className="w-full bg-gray-100/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all font-medium text-gray-900 dark:text-white" 
                  />
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-gray-100/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all font-medium text-gray-900 dark:text-white font-mono" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Authority Level</label>
                  <select 
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value})}
                    className="w-full bg-gray-100/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all font-bold text-gray-900 dark:text-white appearance-none"
                  >
                    <option value="TEAM_MEMBER">Team Member</option>
                    <option value="PROJECT_MANAGER">Project Manager</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Status</label>
                  <select 
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value})}
                    className="w-full bg-gray-100/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all font-bold text-gray-900 dark:text-white appearance-none"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Department Assignment</label>
                <select 
                  value={formData.departmentId}
                  onChange={e => setFormData({...formData, departmentId: e.target.value})}
                  className="w-full bg-gray-100/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all font-bold text-gray-900 dark:text-white appearance-none"
                >
                  <option value="">No Department</option>
                  {departments.map((dep: any) => (
                    <option key={dep.id} value={dep.id}>{dep.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-6 flex gap-3">
                <button 
                  type="button" 
                  onClick={closeModal}
                  className="flex-1 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-900 dark:text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)]"
                >
                  {loading ? "Processing..." : (editingUser ? "Update Node" : "Deploy")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
