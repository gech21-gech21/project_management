"use client";

import { useState } from "react";
import { CheckSquare, Trash2, Edit2, Search, Filter } from "lucide-react";
import { updateTask, deleteTask } from "../actions";

export function TasksClient({ initialTasks }: { initialTasks: any[] }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filteredTasks = tasks.filter(t => {
    const term = searchQuery.toLowerCase();
    const matchSearch = t.title.toLowerCase().includes(term) || (t.taskCode && t.taskCode.toLowerCase().includes(term)) || (t.project?.name.toLowerCase().includes(term));
    const matchStatus = statusFilter === "ALL" || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    await updateTask(taskId, { status: newStatus });
  };

  const handlePriorityChange = async (taskId: string, newPriority: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, priority: newPriority } : t));
    await updateTask(taskId, { priority: newPriority });
  };

  const handleDelete = async (taskId: string) => {
    if(confirm("Are you sure you want to delete this task?")) {
       await deleteTask(taskId);
       setTasks(prev => prev.filter(t => t.id !== taskId));
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center bg-white dark:bg-[#0a0a0a] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-[#1a1a1a]">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
             <CheckSquare className="text-amber-500" />
             Task Master Control
          </h1>
          <p className="text-sm font-bold text-gray-400 mt-1 uppercase tracking-widest">Oversight over all system operations</p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-gray-200 dark:border-gray-700 p-4 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 bg-gray-50 dark:bg-gray-700/50"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50"
        >
          <option value="ALL">All Status</option>
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="REVIEW">Review</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl shadow-sm border border-gray-100 dark:border-[#1a1a1a] overflow-hidden">
         <div className="overflow-x-auto">
           <table className="min-w-full divide-y divide-gray-100 dark:divide-[#1a1a1a]">
             <thead className="bg-gray-50/50 dark:bg-white/5">
                <tr>
                   <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Task ID & Title</th>
                   <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Project</th>
                   <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                   <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Priority</th>
                   <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Assigned To</th>
                   <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-gray-100 dark:divide-[#1a1a1a]">
               {filteredTasks.map(task => (
                 <tr key={task.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02]">
                    <td className="px-6 py-4">
                       <p className="font-bold text-gray-900 dark:text-gray-100 text-sm">{task.title}</p>
                       <p className="text-[10px] font-mono text-gray-400 mt-1">{task.taskCode}</p>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-gray-600 dark:text-gray-400">
                       {task.project?.name}
                    </td>
                    <td className="px-6 py-4">
                       <select value={task.status} onChange={(e) => handleStatusChange(task.id, e.target.value)} className="bg-transparent border border-gray-200 dark:border-white/10 rounded px-2 py-1 text-xs font-bold uppercase tracking-tighter">
                          <option value="TODO">TODO</option>
                          <option value="IN_PROGRESS">IN PROGRESS</option>
                          <option value="REVIEW">REVIEW</option>
                          <option value="COMPLETED">COMPLETED</option>
                       </select>
                    </td>
                    <td className="px-6 py-4">
                       <select value={task.priority} onChange={(e) => handlePriorityChange(task.id, e.target.value)} className={`bg-transparent border border-gray-200 dark:border-white/10 rounded px-2 py-1 text-xs font-bold uppercase tracking-tighter ${
                          task.priority === 'URGENT' ? 'text-red-500' : task.priority === 'HIGH' ? 'text-orange-500' : 'text-blue-500'
                       }`}>
                          <option value="LOW">LOW</option>
                          <option value="MEDIUM">MEDIUM</option>
                          <option value="HIGH">HIGH</option>
                          <option value="URGENT">URGENT</option>
                       </select>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-gray-600 dark:text-gray-400">
                       {task.assignedTo?.fullName || "Unassigned"}
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button onClick={() => handleDelete(task.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10">
                          <Trash2 size={16} />
                       </button>
                    </td>
                 </tr>
               ))}
               {filteredTasks.length === 0 && (
                 <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500 font-medium">No tasks found.</td>
                 </tr>
               )}
             </tbody>
           </table>
         </div>
      </div>
    </div>
  );
}
