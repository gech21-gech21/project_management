"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { 
  Bell, 
  CheckSquare, 
  MessageSquare, 
  AlertCircle, 
  Check, 
  MoreVertical,
  Trash2,
  FolderKanban,
  Download
} from "lucide-react";
import { useToast } from "../providers/ToastProvider";
import { useRouter } from "next/navigation";

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

export function NotificationsDropdown() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { addToast } = useToast();
  const router = useRouter();
  const isFirstLoad = useRef(true);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/notifications");
      if (response.ok) {
        const data = await response.json();
        const allowedTypes = [
          "TASK_ASSIGNED", 
          "PROJECT_ASSIGNED", 
          "PROJECT_UPDATE", 
          "FILE_UPLOAD", 
          "DEADLINE",
          "TEAM_LEADER_ASSIGNED",
          "DEPT_HEAD_ASSIGNED",
          "TASK_COMPLETED",
          "PROJECT_COMPLETED",
          "COMMENT",
          "NEW_MESSAGE"
        ];
        const newNotifications: Notification[] = data.filter((n: Notification) => allowedTypes.includes(n.type));
        
        // On first load, just set the seen IDs without showing toasts
        if (isFirstLoad.current) {
          setSeenIds(new Set(newNotifications.map(n => n.id)));
          isFirstLoad.current = false;
        } else {
          // Find new unread notifications
          const newlyArrived = newNotifications.filter(n => !n.isRead && !seenIds.has(n.id));
          
          newlyArrived.forEach(n => {
            addToast({
              title: n.title,
              message: n.message,
              type: "NOTIFICATION",
              action: n.type === "FILE_UPLOAD" ? {
                label: "View Task",
                onClick: () => router.push(getLink(n)),
                icon: <Download size={12} />
              } : {
                label: "View",
                onClick: () => router.push(getLink(n))
              }
            });
          });

          if (newlyArrived.length > 0) {
            setSeenIds(prev => {
              const next = new Set(prev);
              newlyArrived.forEach(n => next.add(n.id));
              return next;
            });
          }
        }

        setNotifications(newNotifications);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  useEffect(() => {
    if (!session?.user) return; // Don't poll before session is established
    fetchNotifications();
    // Poll every 5 seconds — frequent enough for real-time feel, low enough to avoid hammering
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, [session?.user]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
      case "COMMENT": return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case "NEW_MESSAGE": return <MessageSquare className="w-4 h-4 text-emerald-500" />;
      case "TASK_ASSIGNED": return <CheckSquare className="w-4 h-4 text-green-500" />;
      case "TASK_COMPLETED": return <CheckSquare className="w-4 h-4 text-emerald-600" />;
      case "PROJECT_ASSIGNED":
      case "PROJECT_UPDATE": return <FolderKanban className="w-4 h-4 text-purple-500" />;
      case "PROJECT_COMPLETED": return <FolderKanban className="w-4 h-4 text-emerald-600" />;
      case "TEAM_LEADER_ASSIGNED": return <CheckSquare className="w-4 h-4 text-indigo-500" />;
      case "DEPT_HEAD_ASSIGNED": return <CheckSquare className="w-4 h-4 text-orange-500" />;
      case "FILE_UPLOAD": return <AlertCircle className="w-4 h-4 text-amber-500" />;
      case "DEADLINE": return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Bell className="w-4 h-4 text-gray-500" />;
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

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center border-2 border-white dark:border-gray-900 animate-in fade-in zoom-in duration-300">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              Notifications
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] rounded-full">
                  {unreadCount} new
                </span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <Check size={14} />
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {notifications.length > 0 ? (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group relative ${
                      !notification.isRead ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        !notification.isRead ? "bg-white dark:bg-gray-800 shadow-sm" : "bg-gray-100 dark:bg-gray-800"
                      }`}>
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link 
                          href={getLink(notification)} 
                          onClick={() => {
                            setIsOpen(false);
                            markAsRead(notification.id);
                          }}
                          className="block"
                        >
                          <p className={`text-sm font-medium text-gray-900 dark:text-white truncate ${!notification.isRead ? "font-bold" : ""}`}>
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                        </Link>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 flex items-center gap-2">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          {notification.type === "FILE_UPLOAD" && (
                            <span className="flex items-center gap-1 text-blue-500 font-bold uppercase tracking-tighter">
                              <Download size={10} /> Attachment
                            </span>
                          )}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0 self-start group-hover:hidden"
                        />
                      )}
                      <div className="hidden group-hover:flex items-center gap-1 self-start">
                        {!notification.isRead && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors text-gray-500"
                            title="Mark as read"
                          >
                            <Check size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  No notifications yet
                </p>
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-800 text-center bg-gray-50/50 dark:bg-gray-800/50">
              <Link
                href="/notifications"
                onClick={() => setIsOpen(false)}
                className="text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                View all activity
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
