"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface QCButtonsProps {
  taskId: string;
  assignedToName?: string;
}

export function QCApprovalButtons({ taskId, assignedToName }: QCButtonsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);

  const handleAction = async (action: "approve" | "reject") => {
    setLoading(action);
    try {
      await fetch(`/api/manager/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: action === "approve" ? "COMPLETED" : "IN_PROGRESS",
        }),
      });
      router.refresh();
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="mt-3 flex gap-2">
      <button
        disabled={loading !== null}
        onClick={(e) => { e.preventDefault(); handleAction("approve"); }}
        className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-50"
      >
        {loading === "approve" ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <CheckCircle2 className="w-3 h-3" />
        )}
        Approve
      </button>
      <button
        disabled={loading !== null}
        onClick={(e) => { e.preventDefault(); handleAction("reject"); }}
        className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-50"
      >
        {loading === "reject" ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <XCircle className="w-3 h-3" />
        )}
        Reject
      </button>
    </div>
  );
}
