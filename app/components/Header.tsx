"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  ChevronDown,
  UserCircle,
  LogOut,
  Settings,
  Plus,
  Search,
  MessageSquare,
  X,
  FolderKanban,
  CheckSquare,
  UserPlus,
  Building2
} from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationsDropdown } from "./NotificationsDropdown";

export default function Header() {
  const { data: session } = useSession();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSearchCategoryOpen, setIsSearchCategoryOpen] = useState(false);
  const [searchCategory, setSearchCategory] = useState("All");
  const avatarUrlState = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = avatarUrlState;
  const profileRef = useRef<HTMLDivElement>(null);
  const searchCategoryRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const [headerSearchQuery, setHeaderSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ tasks: any[]; projects: any[]; users: any[] } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isAddDropdownOpen, setIsAddDropdownOpen] = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const addDropdownRef = useRef<HTMLDivElement>(null);

  const fetchUnreadCount = async () => {
    try {
      const res = await fetch("/api/messages/unread");
      if (res.ok) {
        const data = await res.json();
        setUnreadMessageCount(data.count);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 5000);
      return () => clearInterval(interval);
    }
  }, [session?.user]);

  const getBasePath = () => {
    switch(session?.user?.role) {
      case "ADMIN": return "/admin";
      case "PROJECT_MANAGER": return "/manager";
      default: return "/member";
    }
  };

  const getTeamRoute = () => {
    return session?.user?.role === "ADMIN" ? "users" : "team";
  };

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && headerSearchQuery.trim()) {
      setShowDropdown(false);
      const q = encodeURIComponent(headerSearchQuery.trim());
      const base = getBasePath();
      if (searchCategory === "Tasks") {
         router.push(`${base}/tasks?q=${q}&type=title`);
      } else if (searchCategory === "Projects") {
         router.push(`${base}/projects?q=${q}`);
      } else if (searchCategory === "Members") {
         router.push(`${base}/${getTeamRoute()}?q=${q}`);
      } else {
         router.push(`${base}/tasks?q=${q}&type=title`); // fallback
      }
    }
  };

  // Fetch real-time search results
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (headerSearchQuery.trim().length >= 2) {
        setIsSearching(true);
        setShowDropdown(true);
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(headerSearchQuery)}`);
          if (!res.ok) throw new Error(`Search failed: ${res.status}`);
          const data = await res.json();
          setSearchResults(data);
        } catch (e) {
          console.error(e);
          setSearchResults(null);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults(null);
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [headerSearchQuery]);

  // Handle click outside for profile dropdown
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
      if (searchCategoryRef.current && !searchCategoryRef.current.contains(e.target as Node)) {
        setIsSearchCategoryOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
      if (addDropdownRef.current && !addDropdownRef.current.contains(e.target as Node)) {
        setIsAddDropdownOpen(false);
      }
    }
    document.addEventListener("click", onClickOutside);
    return () => document.removeEventListener("click", onClickOutside);
  }, []);


  // Fetch user's avatar from profile API
  useEffect(() => {
    if (session?.user?.id) {
      fetch("/api/profile")
        .then(res => {
          if (!res.ok) throw new Error(`Profile fetch failed: ${res.status}`);
          return res.json();
        })
        .then(data => {
          if (data.data?.avatarUrl) {
            setAvatarUrl(data.data.avatarUrl);
          }
        })
        .catch(() => { });
    }
  }, [session?.user?.id, pathname]);

  const getInitials = () => {
    if (session?.user?.name) {
      return session.user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return "U";
  };

  return (
    <>
      <header className="h-16 bg-white dark:bg-[#0a0a0a] border-b border-gray-200 dark:border-[#1a1a1a] flex items-center justify-between px-6 sticky top-0 z-30 transition-colors duration-300">

        {/* Left: Logo / App Name */}
        <Link href="/dashboard" className="flex items-center gap-2.5 group shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all group-hover:scale-105">
            <FolderKanban className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-black text-gray-900 dark:text-gray-100 tracking-tight hidden sm:block">
            ProjectFlow
          </span>
        </Link>

        {/* Center: Search */}
        <div className="flex-1 max-w-xl mx-4 sm:mx-8">
          <div className="relative w-full" ref={searchContainerRef}>
            <div className="relative w-full flex items-center bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-[#1a1a1a] rounded-xl hover:border-gray-300 dark:hover:border-[#2a2a2a] focus-within:border-blue-500 focus-within:bg-white dark:focus-within:bg-[#151515] transition-all">
              <div className="pl-4 shrink-0">
                <Search size={15} className="text-gray-400 dark:text-gray-500 transition-colors" />
              </div>
              <input
                type="text"
                value={headerSearchQuery}
                onChange={(e) => setHeaderSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
                onFocus={() => {
                  if (headerSearchQuery.trim().length >= 2) setShowDropdown(true);
                }}
                placeholder={`Search ${searchCategory.toLowerCase()}...`}
                className="flex-1 min-w-0 bg-transparent py-2.5 px-3 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none"
              />
              
              <div className="relative shrink-0" ref={searchCategoryRef}>
                <button
                  onClick={() => setIsSearchCategoryOpen(!isSearchCategoryOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 mr-1 text-[11px] font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#2a2a2a] rounded-lg transition-colors border border-transparent dark:hover:border-[#333]"
                >
                  {searchCategory}
                  <ChevronDown size={12} className={`transition-transform ${isSearchCategoryOpen ? 'rotate-180' : ''}`} />
                </button>

                {isSearchCategoryOpen && (
                  <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#1a1a1a] rounded-xl shadow-xl py-1 z-50">
                    {['All', 'Projects', 'Tasks', 'Members'].map((category) => (
                      <button
                        key={category}
                        onClick={() => {
                          setSearchCategory(category);
                          setIsSearchCategoryOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-[11px] font-bold transition-colors ${
                          searchCategory === category 
                            ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#111111]'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Autocomplete Dropdown */}
            {showDropdown && headerSearchQuery.trim().length >= 2 && (
              <div className="absolute top-full mt-2 w-full bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#1a1a1a] rounded-xl shadow-2xl overflow-hidden z-50 max-h-96 overflow-y-auto">
                {isSearching ? (
                  <div className="p-4 text-center text-xs text-gray-500">Searching...</div>
                ) : searchResults && (searchResults.tasks?.length > 0 || searchResults.projects?.length > 0 || searchResults.users?.length > 0) ? (
                  <div className="py-2">
                    {/* Projects Section */}
                    {(searchCategory === 'All' || searchCategory === 'Projects') && searchResults.projects?.length > 0 && (
                      <div className="px-3 py-1">
                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 px-2">Projects</h3>
                        {searchResults.projects.map((p: any) => (
                          <Link key={p.id} href={`${getBasePath()}/projects/${p.id}`} onClick={() => setShowDropdown(false)} className="block px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-[#111111] rounded-lg text-gray-700 dark:text-gray-300 transition-colors">
                            {p.name}
                          </Link>
                        ))}
                      </div>
                    )}
                    
                    {/* Tasks Section */}
                    {(searchCategory === 'All' || searchCategory === 'Tasks') && searchResults.tasks?.length > 0 && (
                      <div className="px-3 py-1 mt-1">
                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 px-2">Tasks</h3>
                        {searchResults.tasks.map((t: any) => (
                          <Link key={t.id} href={`${getBasePath()}/tasks?q=${encodeURIComponent(t.title)}&type=title`} onClick={() => setShowDropdown(false)} className="block px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-[#111111] rounded-lg text-gray-700 dark:text-gray-300 transition-colors">
                            {t.title}
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* Members Section */}
                    {(searchCategory === 'All' || searchCategory === 'Members') && searchResults.users?.length > 0 && (
                      <div className="px-3 py-1 mt-1">
                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 px-2">Members</h3>
                        {searchResults.users.map((u: any) => (
                          <Link key={u.id} href={`${getBasePath()}/${getTeamRoute()}?q=${encodeURIComponent(u.fullName)}`} onClick={() => setShowDropdown(false)} className="block px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-[#111111] rounded-lg text-gray-700 dark:text-gray-300 transition-colors">
                            {u.fullName}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 text-center text-xs text-gray-500">No results found for &ldquo;{headerSearchQuery}&rdquo;</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {session ? (
            <>
              {/* + Add Dropdown */}
              {(session.user?.role === "ADMIN" || session.user?.role === "PROJECT_MANAGER") && (
                <div className="relative" ref={addDropdownRef}>
                  <button 
                    onClick={() => setIsAddDropdownOpen(!isAddDropdownOpen)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-blue-500/20 hover:shadow-blue-500/40 active:scale-95"
                  >
                    <Plus size={14} strokeWidth={2.5} />
                    <span className="hidden sm:inline">Add</span>
                  </button>

                  {isAddDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#1a1a1a] rounded-xl shadow-2xl py-1.5 z-50">
                      <Link 
                        href={`${getBasePath()}/projects`} 
                        onClick={() => setIsAddDropdownOpen(false)} 
                        className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-[#111111] transition-colors"
                      >
                        <FolderKanban size={15} className="text-blue-500" />
                        New Project
                      </Link>
                      <Link 
                        href={`${getBasePath()}/tasks`} 
                        onClick={() => setIsAddDropdownOpen(false)} 
                        className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-[#111111] transition-colors"
                      >
                        <CheckSquare size={15} className="text-green-500" />
                        New Task
                      </Link>
                      {session.user?.role === "ADMIN" && (
                        <>
                          <hr className="my-1 border-gray-100 dark:border-[#1a1a1a]" />
                          <Link 
                            href="/admin/users" 
                            onClick={() => setIsAddDropdownOpen(false)} 
                            className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-[#111111] transition-colors"
                          >
                            <UserPlus size={15} className="text-purple-500" />
                            New User
                          </Link>
                          <Link 
                            href="/admin/departments?create=true" 
                            onClick={() => setIsAddDropdownOpen(false)} 
                            className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-[#111111] transition-colors"
                          >
                            <Building2 size={15} className="text-orange-500" />
                            New Department
                          </Link>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="w-[1px] h-6 bg-gray-100 dark:bg-[#1a1a1a] mx-1 hidden sm:block" />

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Messages */}
              <Link
                href="/messages"
                className="relative w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors"
                title="Messages"
              >
                <MessageSquare size={16} />
                {unreadMessageCount > 0 && (
                  <span className="absolute top-1 right-1 w-5 h-5 bg-emerald-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center border-2 border-white dark:border-[#0a0a0a] animate-in fade-in zoom-in duration-300">
                    {unreadMessageCount > 9 ? "9+" : unreadMessageCount}
                  </span>
                )}
              </Link>

              {/* Notifications */}
              <NotificationsDropdown />

              <div className="w-[1px] h-6 bg-gray-100 dark:bg-[#1a1a1a] mx-1 hidden sm:block" />

              {/* Profile */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-gray-50 dark:hover:bg-[#111111] transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-[10px] text-white font-black border-2 border-white dark:border-[#1a1a1a] shadow-sm overflow-hidden">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : session?.user?.image ? (
                      <img src={session.user.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      getInitials()
                    )}
                  </div>
                  <span className="hidden md:block text-xs font-bold text-gray-900 dark:text-gray-100 truncate max-w-[120px]">
                    {session?.user?.name?.split(" ")[0] || "User"}
                  </span>
                  <ChevronDown size={12} className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors hidden md:block" />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#1a1a1a] rounded-xl shadow-2xl py-1 z-50">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-[#1a1a1a]">
                      <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
                        {session?.user?.name || "User"}
                      </p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate mt-0.5">
                        {session?.user?.email}
                      </p>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                      <Link
                        href="/profile"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-[11px] font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-[#111111] transition-colors"
                      >
                        <UserCircle size={15} className="text-gray-400" />
                        My Profile
                      </Link>
                      <Link
                        href="/settings"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-[11px] font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-[#111111] transition-colors"
                      >
                        <Settings size={15} className="text-gray-400" />
                        Settings
                      </Link>
                    </div>

                    <hr className="border-gray-100 dark:border-[#1a1a1a]" />

                    {/* Sign Out */}
                    <div className="py-1">
                      <button
                        onClick={() => signOut()}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-[11px] font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/10 transition-colors"
                      >
                        <LogOut size={15} />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link
                href="/auth"
                className="text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                Log in
              </Link>
         
            </div>
          )}
        </div>
      </header>


    </>
  );
}
