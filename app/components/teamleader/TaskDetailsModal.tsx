// app/components/teamleader/TaskDetailsModal.tsx
"use client";

interface TaskDetailsModalProps {
  task: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    dueDate: string | null;
    createdAt: string;
    updatedAt: string;
    assignedTo: {
      id: string;
      fullName: string;
      email: string;
    } | null;
    createdBy: {
      id: string;
      fullName: string;
    };
  };
  onClose: () => void;
  onEdit: () => void;
}

export default function TaskDetailsModal({ task, onClose, onEdit }: TaskDetailsModalProps) {
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
      case "REVIEW":
        return "bg-purple-100 text-purple-800";
      case "TODO":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "bg-red-100 text-red-800";
      case "HIGH":
        return "bg-orange-100 text-orange-800";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800";
      case "LOW":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-semibold text-gray-900">{task.title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex gap-3 mb-6">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(task.status)}`}>
              {task.status.replace("_", " ")}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityBadgeColor(task.priority)}`}>
              {task.priority} Priority
            </span>
          </div>

          {task.description && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
              <p className="text-gray-600 whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            {task.assignedTo && (
              <div>
                <p className="text-xs text-gray-500">Assigned To</p>
                <p className="text-sm font-medium text-gray-900">{task.assignedTo.fullName}</p>
                <p className="text-xs text-gray-600">{task.assignedTo.email}</p>
              </div>
            )}

            <div>
              <p className="text-xs text-gray-500">Due Date</p>
              <p className="text-sm font-medium text-gray-900">{formatDate(task.dueDate)}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200">
              <div>
                <p className="text-xs text-gray-500">Created By</p>
                <p className="text-sm text-gray-900">{task.createdBy.fullName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Created At</p>
                <p className="text-sm text-gray-900">{formatDateTime(task.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Last Updated</p>
                <p className="text-sm text-gray-900">{formatDateTime(task.updatedAt)}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-6">
            <button
              onClick={onEdit}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Task
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}