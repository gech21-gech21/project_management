"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { 
  Bell, 
  CheckSquare, 
  MessageSquare, 
  AlertCircle, 
  Check, 
  FolderKanban,
  Download,
  Trash2,
  Filter
} from "lucide-react";
import Link from "next/link";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  relatedId?: string;
  relatedType?: string;
}

export default function NotificationsPage() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "UNREAD">("ALL");

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/notifications?limit=50");
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchNotifications();
    }
  }, [session?.user]);

  if (!session) {
    return null; // Layout handles redirect or wait
  }

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isRead: true }),
      });
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === id ? { ...n, isRead: true } : n)
        );
      }
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch("/api/notifications", { method: "PUT" });
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      }
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "COMMENT": return <MessageSquare className="w-5 h-5 text-blue-500" />;
      case "NEW_MESSAGE": return <MessageSquare className="w-5 h-5 text-emerald-500" />;
      case "TASK_ASSIGNED": return <CheckSquare className="w-5 h-5 text-green-500" />;
      case "TASK_COMPLETED": return <CheckSquare className="w-5 h-5 text-emerald-600" />;
      case "PROJECT_ASSIGNED":
      case "PROJECT_UPDATE": return <FolderKanban className="w-5 h-5 text-purple-500" />;
      case "PROJECT_COMPLETED": return <FolderKanban className="w-5 h-5 text-emerald-600" />;
      case "DEADLINE": return <AlertCircle className="w-5 h-5 text-red-500" />;
      default: return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getLink = (notification: Notification) => {
    const role = session?.user?.role;
    let base = "/member";
    if (role === "ADMIN") base = "/admin";
    if (role === "PROJECT_MANAGER") base = "/manager";

    if (notification.type === "NEW_MESSAGE") return `/messages?userId=${notification.relatedId}`;
    if (notification.relatedType === "TASK") return `${base}/tasks/${notification.relatedId}`;
    if (notification.relatedType === "PROJECT") return `${base}/projects/${notification.relatedId}`;
    return "#";
  };

  const filteredNotifications = filter === "ALL" 
    ? notifications 
    : notifications.filter(n => !n.isRead);

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">Activity Stream</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-widest font-bold">Manage your latest system alerts</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-xl border border-gray-200 dark:border-white/10">
            <button 
              onClick={() => setFilter("ALL")}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filter === "ALL" ? 'bg-white dark:bg-white/10 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              All
            </button>
            <button 
              onClick={() => setFilter("UNREAD")}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filter === "UNREAD" ? 'bg-white dark:bg-white/10 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Unread
            </button>
          </div>
          <button 
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20"
          >
            <Check size={14} strokeWidth={3} />
            Clear All
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0a0a0a] rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-20 text-center">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-gray-500 uppercase tracking-widest font-bold">Synchronizing alerts...</p>
          </div>
        ) : filteredNotifications.length > 0 ? (
          <div className="divide-y divide-gray-50 dark:divide-white/5">
            {filteredNotifications.map((notification) => (
              <div 
                key={notification.id}
                className={`p-6 hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors relative group ${!notification.isRead ? 'bg-blue-50/30 dark:bg-blue-500/[0.02]' : ''}`}
              >
                <div className="flex gap-5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${!notification.isRead ? 'bg-white dark:bg-white/10 ring-1 ring-blue-500/20' : 'bg-gray-50 dark:bg-white/5'}`}>
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <Link href={getLink(notification)} onClick={() => markAsRead(notification.id)} className="group/link">
                          <h3 className={`text-base font-bold text-gray-900 dark:text-white group-hover/link:text-blue-600 dark:group-hover/link:text-blue-400 transition-colors ${!notification.isRead ? 'font-black' : ''}`}>
                            {notification.title}
                          </h3>
                        </Link>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                          {notification.message}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <div className="w-2.5 h-2.5 bg-blue-600 rounded-full shrink-0 mt-1.5 shadow-[0_0_10px_rgba(37,99,235,0.5)]" />
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-4">
                      <span className="text-[10px] font-mono text-gray-400 uppercase tracking-tighter bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded">
                        {format(new Date(notification.createdAt), "MMM d, yyyy • h:mm a")}
                      </span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        {notification.type.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-20 text-center">
            <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <Bell className="w-10 h-10 text-gray-200 dark:text-gray-700" />
            </div>
            <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-widest">Zero Alerts</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">You&apos;re all caught up! No new notifications found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
