"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  Settings,
  LogOut,
  Bell,
  Menu,
  X,
  ChevronDown,
  UserCircle,
  BarChart3,
  Clock,
  MessageSquare,
  Home,
  Briefcase,
  UserPlus,
  Calendar
} from "lucide-react";

export default function Navigation() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications] = useState(3); // Example notification count
  const profileRef = useRef<HTMLDivElement>(null);

  // Log session data for debugging
  useEffect(() => {
    console.log("🔍 Navigation - Session Data:", session);
    console.log("🔍 Navigation - User Role:", session?.user?.role);
  }, [session]);

  // Handle click outside for profile dropdown
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("click", onClickOutside);
    return () => document.removeEventListener("click", onClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: "/" });
  };

  const getInitials = () => {
    if (session?.user?.name) {
      return session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (session?.user?.email) {
      return session.user.email[0].toUpperCase();
    }
    return "U";
  };

  // Role-based navigation links
  const getNavLinks = () => {
    const role = session?.user?.role;

    // Admin Navigation
    if (role === "ADMIN") {
      return [
        {
          name: "Dashboard",
          href: "/admin",
          icon: LayoutDashboard,
        },
        {
          name: "Projects",
          href: "/admin/projects",
          icon: FolderKanban,
        },
        {
          name: "Tasks",
          href: "/admin/tasks",
          icon: CheckSquare,
        },
        {
          name: "Teams",
          href: "/admin/teams",
          icon: Users,
        },
        {
          name: "Users",
          href: "/admin/users",
          icon: UserPlus,
        },
        {
          name: "Settings",
          href: "/admin/settings",
          icon: Settings,
        },
      ];
    }

    // Team Leader Navigation
    if (role === "TEAMLEADER") {
      return [
        {
          name: "Dashboard",
          href: "/teamleader",
          icon: LayoutDashboard,
        },
        {
          name: "My Projects",
          href: "/teamleader/projects",
          icon: FolderKanban,
        },
        {
          name: "Tasks",
          href: "/teamleader/tasks",
          icon: CheckSquare,
        },
        {
          name: "My Team",
          href: "/teamleader/team",
          icon: Users,
        },
        {
          name: "Progress",
          href: "/teamleader/progress",
          icon: BarChart3,
        },
        {
          name: "Messages",
          href: "/teamleader/messages",
          icon: MessageSquare,
        },
      ];
    }

    // Member Navigation
    if (role === "MEMBER" || role === "USER") {
      return [
        {
          name: "Dashboard",
          href: "/member",
          icon: LayoutDashboard,
        },
        {
          name: "My Tasks",
          href: "/member/tasks",
          icon: CheckSquare,
        },
        {
          name: "Projects",
          href: "/member/projects",
          icon: FolderKanban,
        },
        {
          name: "My Team",
          href: "/member/team",
          icon: Users,
        },
       
        {
          name: "Messages",
          href: "/member/messages",
          icon: MessageSquare,
        },
      ];
    }

    // Default navigation for unauthenticated users
    return [
      {
        name: "Home",
        href: "/",
        icon: Home,
      },
      {
        name: "About",
        href: "/about",
        icon: Briefcase,
      },
    ];
  };

  const navLinks = getNavLinks();

  // Get dashboard home link based on role
  const getDashboardHome = () => {
    const role = session?.user?.role;
    if (role === "ADMIN") return "/admin";
    if (role === "TEAMLEADER") return "/teamleader";
    if (role === "MEMBER" || role === "USER") return "/member";
    return "/";
  };

  // Get role display name
  const getRoleDisplay = () => {
    const role = session?.user?.role;
    switch (role) {
      case "ADMIN":
        return "Administrator";
      case "TEAMLEADER":
        return "Team Leader";
      case "MEMBER":
        return "Team Member";
      default:
        return role?.replace("_", " ") || "User";
    }
  };

  // Get role-based badge color
  const getRoleBadgeColor = () => {
    const role = session?.user?.role;
    switch (role) {
      case "ADMIN":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
      case "TEAMLEADER":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "MEMBER":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 fixed w-full z-30 top-0">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo and Mobile Menu Button */}
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Logo */}
            <Link href={getDashboardHome()} className="flex items-center gap-2">
              <span className="text-xl font-bold text-gray-900 dark:text-white hidden sm:block">
                Project<span className="text-blue-600">Flow</span>
              </span>
            </Link>

            {/* Role Badge - Mobile */}
            {session && (
              <span className={`lg:hidden text-xs px-2 py-1 rounded-full ${getRoleBadgeColor()}`}>
                {getRoleDisplay()}
              </span>
            )}
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || pathname.startsWith(link.href + "/");

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 relative ${isActive
                    ? "text-blue-600 dark:text-blue-400 after:absolute after:bottom-0 after:left-4 after:right-4 after:h-0.5 after:bg-blue-600 after:rounded-full"
                    : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    }`}
                >
                  <Icon size={18} />
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* Right: Role Badge + Notifications + Profile */}
          <div className="flex items-center gap-3">
            {session ? (
              <>
                {/* Role Badge - Desktop */}
                <span className={`hidden lg:inline-block text-xs px-3 py-1.5 rounded-full ${getRoleBadgeColor()}`}>
                  {getRoleDisplay()}
                </span>

                {/* Notifications */}
                <button className="relative p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <Bell size={20} />
                  {notifications > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center animate-pulse">
                      {notifications}
                    </span>
                  )}
                </button>

                {/* Profile Dropdown */}
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                      {session.user?.image ? (
                        <img
                          src={session.user.image}
                          alt={session.user.name || ""}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        getInitials()
                      )}
                    </div>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {session.user?.name || session.user?.email?.split("@")[0]}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {getRoleDisplay()}
                      </p>
                    </div>
                    <ChevronDown
                      size={16}
                      className={`text-gray-500 hidden md:block transition-transform duration-200 ${isProfileOpen ? "rotate-180" : ""
                        }`}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 transform transition-all duration-200 origin-top-right">
                      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {session.user?.name || session.user?.email}
                        </p>
                        <p className={`text-xs mt-1 px-2 py-0.5 rounded-full inline-block ${getRoleBadgeColor()}`}>
                          {getRoleDisplay()}
                        </p>
                      </div>
                      <Link
                        href="/profile"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <UserCircle size={16} />
                        Profile
                      </Link>
                      <Link
                        href="/settings"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Settings size={16} />
                        Settings
                      </Link>
                      <hr className="my-1 border-gray-200 dark:border-gray-700" />
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <LogOut size={16} />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth"
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Login
                </Link>
              
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && session && (
        <div className="lg:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 animate-slideDown">
          <div className="px-4 py-3 space-y-1">
            {/* Mobile User Info */}
            <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-lg mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                {session.user?.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name || ""}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  getInitials()
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {session.user?.name || session.user?.email?.split("@")[0]}
                </p>
                <p className={`text-xs mt-1 px-2 py-0.5 rounded-full inline-block ${getRoleBadgeColor()}`}>
                  {getRoleDisplay()}
                </p>
              </div>
            </div>

            {/* Navigation Links */}
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || pathname.startsWith(link.href + "/");

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                >
                  <Icon size={20} />
                  {link.name}
                </Link>
              );
            })}

            <hr className="my-2 border-gray-200 dark:border-gray-700" />

            {/* Mobile Menu Additional Links */}
            <Link
              href="/profile"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <UserCircle size={20} />
              Profile
            </Link>
            <Link
              href="/settings"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Settings size={20} />
              Settings
            </Link>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <LogOut size={20} />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}