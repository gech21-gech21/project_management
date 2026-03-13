"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  CheckCircle2, 
  PlayCircle, 
  Send, 
  Loader2,
  MessageSquare,
  AlertCircle
} from "lucide-react";

interface MemberTaskInteractionProps {
  taskId: string;
  initialStatus: string;
}

export function MemberTaskInteraction({ 
  taskId, 
  initialStatus 
}: MemberTaskInteractionProps) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [comment, setComment] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isSendingComment, setIsSendingComment] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStatusUpdate = async (newStatus: string) => {
    setIsUpdatingStatus(true);
    setError(null);
    try {
      const response = await fetch(`/api/member/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error("Failed to update status");

      setStatus(newStatus);
      router.refresh();
    } catch (err) {
      setError("Failed to update task status. Please try again.");
      console.error(err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSendComment = async () => {
    if (!comment.trim()) return;

    setIsSendingComment(true);
    setError(null);
    try {
      const response = await fetch(`/api/member/tasks/${taskId}/comments`, {
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

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-600 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Status Controls */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h4 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Update Status</h4>
        <div className="flex flex-wrap gap-3">
          {status === "TODO" && (
            <button
              onClick={() => handleStatusUpdate("IN_PROGRESS")}
              disabled={isUpdatingStatus}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isUpdatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
              Start Task
            </button>
          )}

          {status === "IN_PROGRESS" && (
            <button
              onClick={() => handleStatusUpdate("COMPLETED")}
              disabled={isUpdatingStatus}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {isUpdatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Mark as Completed
            </button>
          )}

          {status === "COMPLETED" && (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 border border-green-100 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
              Task Completed
            </div>
          )}

          {status === "REVIEW" && (
            <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 border border-purple-100 rounded-xl">
              <AlertCircle className="w-4 h-4" />
              Under Review
            </div>
          )}
        </div>
      </div>

      {/* Comment Input */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h4 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Add Message
        </h4>
        <div className="space-y-4">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write a message to your manager..."
            className="w-full min-h-[100px] p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none resize-none text-sm"
          />
          <div className="flex justify-end">
            <button
              onClick={handleSendComment}
              disabled={!comment.trim() || isSendingComment}
              className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-black transition-colors disabled:opacity-50 font-semibold text-sm"
            >
              {isSendingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send Message
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
