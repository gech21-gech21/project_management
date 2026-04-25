"use client";

import { useState } from "react";
import { format } from "date-fns";
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  MessageSquare, 
  Paperclip, 
  Send,
  AlertTriangle,
  PlayCircle
} from "lucide-react";
import { updateTaskStatus, reportBlocker, addComment } from "../actions";

export function TaskDetailClient({ task, currentUser }: { task: any, currentUser: any }) {
  const [commentText, setCommentText] = useState("");
  const [blockerText, setBlockerText] = useState("");
  const [showBlockerInput, setShowBlockerInput] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleStatusChange = async (newStatus: "TODO" | "IN_PROGRESS" | "REVIEW" | "COMPLETED") => {
    await updateTaskStatus(task.id, newStatus);
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    await addComment(task.id, commentText);
    setCommentText("");
  };

  const handleReportBlocker = async () => {
    if (!blockerText.trim()) return;
    await reportBlocker(task.id, blockerText);
    setShowBlockerInput(false);
    setBlockerText("");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("taskId", task.id);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Upload error details:", errorData.details);
        throw new Error(errorData.error + (errorData.details ? ": " + errorData.details : "") || "Server returned an error");
      }

      // The page needs to refresh to show the new attachment
      window.location.reload();
    } catch (error) {
      console.error("Upload failed:", error);
      alert(error instanceof Error ? error.message : "Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

  const statusColors = {
    TODO: "bg-gray-100 text-gray-800",
    IN_PROGRESS: "bg-blue-100 text-blue-800",
    REVIEW: "bg-yellow-100 text-yellow-800",
    COMPLETED: "bg-green-100 text-green-800",
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-6 max-w-7xl mx-auto">
      {/* Left Column: Details & Actions */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl p-8 border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden">
          {task.isBlocked && (
            <div className="absolute top-0 left-0 w-full bg-red-500 text-white p-2 text-center text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2">
              <AlertTriangle size={14} /> Task is Blocked: {task.blockerReason}
            </div>
          )}
          <div className={task.isBlocked ? "mt-6" : ""}>
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                {task.project.name} / {task.taskCode}
              </span>
              <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${statusColors[task.status as keyof typeof statusColors]}`}>
                {task.status.replace("_", " ")}
              </span>
            </div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-4">{task.title}</h1>
            <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap text-sm leading-relaxed mb-8">
              {task.description || "No description provided."}
            </p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <button 
                onClick={() => handleStatusChange("TODO")}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${task.status === "TODO" ? "border-gray-500 bg-gray-50 dark:bg-white/5" : "border-gray-200 dark:border-white/5 hover:border-gray-300"}`}
              >
                <Clock size={20} className="text-gray-500" />
                <span className="text-[10px] font-bold uppercase">To Do</span>
              </button>
              <button 
                onClick={() => handleStatusChange("IN_PROGRESS")}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${task.status === "IN_PROGRESS" ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10" : "border-gray-200 dark:border-white/5 hover:border-blue-300"}`}
              >
                <PlayCircle size={20} className="text-blue-500" />
                <span className="text-[10px] font-bold uppercase">Start Progress</span>
              </button>
              <button 
                onClick={() => handleStatusChange("COMPLETED")}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${task.status === "COMPLETED" ? "border-green-500 bg-green-50 dark:bg-green-500/10" : "border-gray-200 dark:border-white/5 hover:border-green-300"}`}
              >
                <CheckCircle2 size={20} className="text-green-500" />
                <span className="text-[10px] font-bold uppercase">Mark Done</span>
              </button>
            </div>

            {!showBlockerInput ? (
               <button onClick={() => setShowBlockerInput(true)} className="text-xs font-bold text-red-500 flex items-center gap-2 uppercase tracking-wide hover:underline cursor-pointer">
                 <AlertTriangle size={14} /> Report Blocker
               </button>
            ) : (
               <div className="p-4 bg-red-50 dark:bg-red-500/5 rounded-xl border border-red-100 dark:border-red-500/20 flex gap-2">
                 <input 
                   type="text" 
                   value={blockerText} 
                   onChange={e => setBlockerText(e.target.value)} 
                   placeholder="Why are you blocked?" 
                   className="flex-1 bg-white dark:bg-[#0a0a0a] border border-red-200 dark:border-red-500/30 rounded p-2 text-sm focus:outline-none"
                 />
                 <button onClick={handleReportBlocker} className="bg-red-500 text-white px-4 py-2 rounded text-xs font-bold uppercase">Submit</button>
                 <button onClick={() => setShowBlockerInput(false)} className="text-gray-500 px-4 py-2 rounded text-xs font-bold uppercase">Cancel</button>
               </div>
            )}
          </div>
        </div>

        {/* Comments Section */}
        <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
          <h2 className="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white mb-6 flex items-center gap-2">
             <MessageSquare size={16} /> Discussion
          </h2>
          
          <div className="space-y-6 mb-6 max-h-[400px] overflow-y-auto pr-2">
             {task.comments.length === 0 ? (
               <p className="text-center text-gray-400 text-xs py-8">No comments yet. Start the discussion!</p>
             ) : (
               task.comments.map((comment: any) => (
                 <div key={comment.id} className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                       {comment.user.fullName.charAt(0)}
                    </div>
                    <div className="flex-1 bg-gray-50 dark:bg-white/5 rounded-2xl rounded-tl-none p-4 border border-gray-100 dark:border-white/10">
                       <div className="flex justify-between items-center mb-2">
                          <span className="font-bold text-xs text-gray-900 dark:text-gray-100">{comment.user.fullName}</span>
                          <span className="text-[10px] text-gray-400">{format(new Date(comment.createdAt), "MMM d, h:mm a")}</span>
                       </div>
                       <p className="text-sm text-gray-600 dark:text-gray-300">{comment.content}</p>
                    </div>
                 </div>
               ))
             )}
          </div>

          <div className="flex gap-2">
            <input 
               type="text" 
               value={commentText}
               onChange={(e) => setCommentText(e.target.value)}
               placeholder="Write an update or ask a question..." 
               className="flex-1 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0a0a0a] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
               onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
            />
            <button onClick={handleAddComment} className="bg-blue-500 hover:bg-blue-600 text-white px-5 rounded-xl flex items-center justify-center transition-colors">
               <Send size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: Meta & Files */}
      <div className="space-y-6">
         {/* Meta Box */}
         <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
            <h3 className="text-[10px] font-black tracking-widest uppercase text-gray-400 mb-4">Task Metadata</h3>
            <div className="space-y-4">
               <div>
                 <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Due Date</p>
                 <p className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Clock size={14} className="text-blue-500" />
                    {task.dueDate ? format(new Date(task.dueDate), "MMM do, yyyy") : "No specific deadline"}
                 </p>
               </div>
               <div>
                 <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Priority</p>
                 <p className="text-xs font-bold text-red-500 border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-500/10 px-2 py-1 rounded inline-block">
                    {task.priority}
                 </p>
               </div>
               <div>
                 <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Assigned PM</p>
                 <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {task.project.projectManager?.fullName || "Unmanaged Hub"}
                 </p>
               </div>
            </div>
         </div>

         {/* Attachments Box */}
         <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="flex justify-between items-center mb-4">
               <h3 className="text-[10px] font-black tracking-widest uppercase text-gray-400 flex items-center gap-1">
                  <Paperclip size={12} /> Attachments
               </h3>
               
               <label className="cursor-pointer bg-blue-50 dark:bg-blue-500/10 text-blue-600 px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-colors">
                  {isUploading ? "Uploading..." : "Upload File"}
                  <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
               </label>
            </div>

            <div className="space-y-3">
               {task.attachments.length === 0 ? (
                 <p className="text-xs text-gray-400 text-center py-4 italic">No files attached</p>
               ) : (
                 task.attachments.map((file: any) => (
                    <a 
                       key={file.id} 
                       href={file.filePath} 
                       target="_blank" 
                       rel="noreferrer"
                       className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 dark:border-white/5 hover:border-blue-500 dark:hover:border-blue-500 group transition-colors"
                    >
                       <div className="bg-gray-100 dark:bg-white/10 p-2 rounded shrink-0">
                          <Paperclip size={16} className="text-gray-500 dark:text-gray-400" />
                       </div>
                       <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-500 transition-colors">
                             {file.originalFilename}
                          </p>
                          <p className="text-[10px] text-gray-400 uppercase tracking-widest">
                             {format(new Date(file.createdAt), "MMM d")}
                          </p>
                       </div>
                    </a>
                 ))
               )}
            </div>
         </div>
      </div>
    </div>
  );
}
