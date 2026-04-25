"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  Settings,
  Search,
  Rocket,
  Activity,
  BarChart,
  Shield,
  Globe,
  ChevronDown,
  BarChart3,
  MessageSquare,
  UserPlus,
  Home,
  Briefcase,
  Building2
} from "lucide-react";

export default function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const getNavLinks = () => {
    const role = session?.user?.role;

    if (role === "ADMIN") {
      return [
        { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
        { name: "Projects", href: "/admin/projects", icon: FolderKanban },
        { name: "Tasks", href: "/admin/tasks", icon: CheckSquare },
        { name: "Teams", href: "/admin/teams", icon: Users },
        { name: "Users", href: "/admin/users", icon: UserPlus },
        { name: "Departments", href: "/admin/departments", icon: Building2 },
        { name: "Analytics", href: "/admin/analytics", icon: BarChart },
        { name: "Settings", href: "/admin/settings", icon: Settings },
      ];
    }

    if (role === "PROJECT_MANAGER") {
      return [
        { name: "Team Overview", href: "/manager", icon: LayoutDashboard },
        { name: "Projects", href: "/manager/projects", icon: FolderKanban },
        { name: "Team Tasks", href: "/manager/tasks", icon: CheckSquare },
        { name: "My Team", href: "/manager/team", icon: Users },
        { name: "Progress Tracking", href: "/manager/progress", icon: BarChart3 },
        { name: "Team Messages", href: "/manager/messages", icon: MessageSquare },
      ];
    }

    if (role === "TEAM_MEMBER") {
      return [
        { name: "Dashboard", href: "/member", icon: LayoutDashboard },
        { name: "My Tasks", href: "/member/tasks", icon: CheckSquare },
        { name: "Projects", href: "/member/projects", icon: FolderKanban },
        { name: "My Team", href: "/member/team", icon: Users },
        { name: "Messages", href: "/member/messages", icon: MessageSquare },
      ];
    }

    return [
      { name: "Home", href: "/", icon: Home },
      { name: "About", href: "/about", icon: Briefcase },
    ];
  };

  const navLinks = getNavLinks();

  return (
    <aside className="w-64 h-screen bg-white dark:bg-[#0a0a0a] border-r border-gray-200 dark:border-[#1a1a1a] flex flex-col fixed left-0 top-0 z-40 overflow-y-auto transition-colors duration-300">
      {/* Top Section: Context Switcher */}
      <div className="p-4 border-b border-gray-100 dark:border-[#1a1a1a]">
        <button className="flex items-center justify-between w-full px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-all">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-6 h-6 rounded bg-gradient-to-tr from-blue-500 to-purple-500 flex-shrink-0" />
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {session?.user?.name ? `${session.user.name}'s space` : "ProjectFlow"}
            </span>
          </div>
          <ChevronDown size={14} className="text-gray-400" />
        </button>
      </div>

      {/* Nav Content */}
      <div className="flex-1 px-3 py-4 space-y-4">
        {/* Search */}
        <div className="px-1">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={14} />
            <input
              type="text"
              placeholder="Find..."
              className="w-full h-9 pl-9 pr-8 bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-[#1a1a1a] rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 h-5 px-1.5 flex items-center bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded text-[10px] text-gray-400 font-mono">
              F
            </kbd>
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 group ${
                  isActive
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 font-medium"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-[#1a1a1a]"
                }`}
              >
                <Icon size={16} className={`${isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"}`} />
                {link.name}
              </Link>
            );
          })}
        </nav>
      </div>


    </aside>
  );
}
