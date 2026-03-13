"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  CheckCircle2, 
  PlayCircle, 
  Send, 
  Loader2,
  MessageSquare,
  AlertCircle,
  User,
  Trash2
} from "lucide-react";

interface TeamLeaderTaskInteractionProps {
  taskId: string;
  initialStatus: string;
  teamMembers: any[];
  initialAssigneeId: string | null;
}

export function TeamLeaderTaskInteraction({ 
  taskId, 
  initialStatus,
  teamMembers,
  initialAssigneeId
}: TeamLeaderTaskInteractionProps) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [assigneeId, setAssigneeId] = useState(initialAssigneeId);
  const [comment, setComment] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSendingComment, setIsSendingComment] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = async (updates: any) => {
    setIsUpdating(true);
    setError(null);
    try {
      const response = await fetch(`/api/teamleader/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update task");
      }

      if (updates.status) setStatus(updates.status);
      if (updates.assignedToId !== undefined) setAssigneeId(updates.assignedToId);
      
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to update task. Please try again.");
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSendComment = async () => {
    if (!comment.trim()) return;

    setIsSendingComment(true);
    setError(null);
    try {
      const response = await fetch(`/api/teamleader/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: comment }),
      });

      if (!response.ok) throw new Error("Failed to send comment");

      setComment("");
      router.refresh();
    } catch (err) {
      setError("Failed to post comment. Please try again.");
      console.error(err);
    } finally {
      setIsSendingComment(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    setIsDeleting(true);
    setError(null);
    try {
      const response = await fetch(`/api/teamleader/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete task");

      router.push("/teamleader/tasks");
      router.refresh();
    } catch (err) {
      setError("Failed to delete task. Please try again.");
      console.error(err);
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-600 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Status & Assignment */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h4 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Management</h4>
        
        <div className="space-y-4">
            <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Assignee</label>
                <select 
                    value={assigneeId || ""} 
                    onChange={(e) => handleUpdate({ assignedToId: e.target.value || null })}
                    disabled={isUpdating}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                >
                    <option value="">Unassigned</option>
                    {teamMembers.map(member => (
                        <option key={member.id} value={member.id}>{member.fullName}</option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Status</label>
                <div className="flex flex-wrap gap-2">
                    {["TODO", "IN_PROGRESS", "REVIEW", "COMPLETED"].map((s) => (
                        <button
                            key={s}
                            onClick={() => handleUpdate({ status: s })}
                            disabled={isUpdating || status === s}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                status === s 
                                ? "bg-blue-600 text-white" 
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            } disabled:opacity-50`}
                        >
                            {isUpdating && status !== s ? "..." : s.replace("_", " ")}
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="pt-4 border-t border-gray-100">
                <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors text-sm font-bold disabled:opacity-50"
                >
                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    Delete Task
                </button>
            </div>
        </div>
      </div>

      {/* Comment Input */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h4 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Add Comment
        </h4>
        <div className="space-y-4">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write a comment..."
            className="w-full min-h-[100px] p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none resize-none text-sm"
          />
          <div className="flex justify-end">
            <button
              onClick={handleSendComment}
              disabled={!comment.trim() || isSendingComment}
              className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-black transition-colors disabled:opacity-50 font-semibold text-sm"
            >
              {isSendingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send Comment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
