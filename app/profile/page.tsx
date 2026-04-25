"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { 
  User, Shield, Mail, Calendar, Clock, Building2, 
  Users, Eye, EyeOff, Check, AlertCircle, Loader2,
  Camera, Trash2, ImagePlus 
} from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  username: string;
  avatarUrl: string | null;
  role: string;
  status: string;
  emailVerified: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  department: { id: string; name: string } | null;
  teamMemberships: { team: { id: string; name: string } }[];
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [activeSection, setActiveSection] = useState<"info" | "password">("info");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (status === "authenticated") {
      fetchProfile();
    }
  }, [status, router]);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile(data.data);
        setFullName(data.data.fullName);
        setUsername(data.data.username);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate on client side
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      setMessage({ type: "error", text: "Invalid file type. Allowed: JPG, PNG, WebP, GIF" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "File too large. Maximum size is 5MB" });
      return;
    }

    setUploadingAvatar(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: "Profile picture updated successfully" });
        fetchProfile();
      } else {
        setMessage({ type: "error", text: data.error || "Failed to upload image" });
      }
    } catch {
      setMessage({ type: "error", text: "An error occurred while uploading" });
    } finally {
      setUploadingAvatar(false);
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveAvatar = async () => {
    setUploadingAvatar(true);
    setMessage(null);

    try {
      const res = await fetch("/api/profile/avatar", { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: "Profile picture removed" });
        fetchProfile();
      } else {
        setMessage({ type: "error", text: data.error || "Failed to remove image" });
      }
    } catch {
      setMessage({ type: "error", text: "An error occurred" });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, username }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: "Profile updated successfully" });
        fetchProfile();
      } else {
        setMessage({ type: "error", text: data.error || "Failed to update profile" });
      }
    } catch {
      setMessage({ type: "error", text: "An error occurred" });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match" });
      return;
    }
    if (newPassword.length < 8) {
      setMessage({ type: "error", text: "Password must be at least 8 characters" });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: "Password changed successfully" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setMessage({ type: "error", text: data.error || "Failed to change password" });
      }
    } catch {
      setMessage({ type: "error", text: "An error occurred" });
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return "Never";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric",
    });
  };

  const getRoleBadge = (role: string) => {
    const map: Record<string, string> = {
      ADMIN: "bg-red-50 text-red-600 border-red-100 dark:bg-red-900/10 dark:text-red-400 dark:border-red-900/20",
      PROJECT_MANAGER: "bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/10 dark:text-purple-400 dark:border-purple-900/20",
      TEAM_LEADER: "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/10 dark:text-blue-400 dark:border-blue-900/20",
      MEMBER: "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/10 dark:text-emerald-400 dark:border-emerald-900/20",
    };
    return map[role] || map.MEMBER;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-[#0a0a0a]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] animate-pulse">Loading Profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Profile Header Card */}
        <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl shadow-sm border border-gray-100 dark:border-[#1a1a1a] overflow-hidden mb-10">
          <div className="h-32 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 relative">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMjAgMjBMMjAgMCIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMDUiIHN0cm9rZS13aWR0aD0iMSIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0wIDIwTDQwIDIwIiBzdHJva2U9IndoaXRlIiBzdHJva2Utb3BhY2l0eT0iMC4wNSIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIi8+PC9zdmc+')] opacity-50"></div>
          </div>
          <div className="px-8 pb-8 -mt-16 relative">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6">
              {/* Avatar with Upload Overlay */}
              <div className="relative group">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  id="avatar-upload"
                />
                {profile.avatarUrl ? (
                  <div className="w-28 h-28 rounded-2xl border-4 border-white dark:border-[#0a0a0a] shadow-xl overflow-hidden">
                    <img
                      src={profile.avatarUrl}
                      alt={profile.fullName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-4xl font-black text-white border-4 border-white dark:border-[#0a0a0a] shadow-xl">
                    {profile.fullName.charAt(0)}
                  </div>
                )}

                {/* Upload Overlay */}
                <div
                  className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/50 flex items-center justify-center transition-all duration-300 cursor-pointer border-4 border-transparent"
                  onClick={() => !uploadingAvatar && fileInputRef.current?.click()}
                >
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center gap-1">
                    {uploadingAvatar ? (
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    ) : (
                      <>
                        <Camera className="w-6 h-6 text-white" />
                        <span className="text-[9px] font-bold text-white uppercase tracking-wider">Change</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Remove button - only show when avatar exists */}
                {profile.avatarUrl && !uploadingAvatar && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleRemoveAvatar(); }}
                    className="absolute -top-1 -right-1 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg border-2 border-white dark:border-[#0a0a0a]"
                    title="Remove photo"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
              <div className="flex-1 pt-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                  <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">{profile.fullName}</h1>
                  <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider border ${getRoleBadge(profile.role)}`}>
                    {profile.role.replace("_", " ")}
                  </span>
                </div>
                <p className="text-sm font-mono text-gray-400 dark:text-gray-500">@{profile.username}</p>
              </div>
            </div>

            {/* Quick Info Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              {[
                { icon: Mail, label: "Email", value: profile.email },
                { icon: Building2, label: "Department", value: profile.department?.name || "Unassigned" },
                { icon: Users, label: "Team", value: profile.teamMemberships?.[0]?.team?.name || "No Team" },
                { icon: Calendar, label: "Member Since", value: formatDate(profile.createdAt) },
              ].map((item) => (
                <div key={item.label} className="bg-gray-50/50 dark:bg-white/[0.02] rounded-xl p-4 border border-gray-100 dark:border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <item.icon className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.label}</span>
                  </div>
                  <p className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Status Message */}
        {message && (
          <div className={`mb-8 p-4 rounded-xl border flex items-center gap-3 ${
            message.type === "success" 
              ? "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-900/20 text-emerald-700 dark:text-emerald-400" 
              : "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/20 text-red-700 dark:text-red-400"
          }`}>
            {message.type === "success" ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="text-sm font-medium">{message.text}</span>
          </div>
        )}

        {/* Section Tabs */}
        <div className="flex gap-1 mb-8 bg-gray-50 dark:bg-white/[0.02] rounded-xl p-1 border border-gray-100 dark:border-white/5">
          {[
            { id: "info" as const, label: "Profile Information", icon: User },
            { id: "password" as const, label: "Security", icon: Shield },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveSection(tab.id); setMessage(null); }}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                activeSection === tab.id
                  ? "bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100 shadow-sm border border-gray-100 dark:border-white/10"
                  : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Profile Information Form */}
        {activeSection === "info" && (
          <form onSubmit={handleUpdateProfile} className="bg-white dark:bg-[#0a0a0a] rounded-2xl shadow-sm border border-gray-100 dark:border-[#1a1a1a] overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-100 dark:border-white/5 bg-gray-50/30 dark:bg-white/5">
              <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <User className="w-4 h-4 text-blue-500" />
                Personal Information
              </h2>
            </div>
            <div className="p-8 space-y-6">
              {/* Email (read-only) */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Email Address</label>
                <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-white/[0.02] rounded-xl border border-gray-100 dark:border-white/5">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">{profile.email}</span>
                  <span className="ml-auto text-[9px] font-black text-gray-300 dark:text-gray-600 uppercase">Read Only</span>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label htmlFor="fullName" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Full Name</label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-[#0a0a0a] rounded-xl border border-gray-200 dark:border-[#1a1a1a] text-sm font-medium text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 dark:focus:border-blue-400 outline-none transition-all placeholder:text-gray-300 dark:placeholder:text-gray-600"
                  placeholder="Enter your full name"
                />
              </div>

              {/* Username */}
              <div>
                <label htmlFor="username" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Username</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-300 dark:text-gray-600 font-mono">@</span>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 bg-white dark:bg-[#0a0a0a] rounded-xl border border-gray-200 dark:border-[#1a1a1a] text-sm font-medium text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 dark:focus:border-blue-400 outline-none transition-all placeholder:text-gray-300 dark:placeholder:text-gray-600"
                    placeholder="username"
                  />
                </div>
              </div>

              {/* Role (read-only) */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Role</label>
                <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-white/[0.02] rounded-xl border border-gray-100 dark:border-white/5">
                  <Shield className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">{profile.role.replace("_", " ")}</span>
                  <span className="ml-auto text-[9px] font-black text-gray-300 dark:text-gray-600 uppercase">Admin Managed</span>
                </div>
              </div>
            </div>

            <div className="px-8 py-6 border-t border-gray-100 dark:border-white/5 bg-gray-50/30 dark:bg-white/5 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}

        {/* Password Change Form */}
        {activeSection === "password" && (
          <form onSubmit={handleChangePassword} className="bg-white dark:bg-[#0a0a0a] rounded-2xl shadow-sm border border-gray-100 dark:border-[#1a1a1a] overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-100 dark:border-white/5 bg-gray-50/30 dark:bg-white/5">
              <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-500" />
                Change Password
              </h2>
            </div>
            <div className="p-8 space-y-6">
              {/* Current Password */}
              <div>
                <label htmlFor="currentPassword" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Current Password</label>
                <div className="relative">
                  <input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 bg-white dark:bg-[#0a0a0a] rounded-xl border border-gray-200 dark:border-[#1a1a1a] text-sm font-medium text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 dark:focus:border-blue-400 outline-none transition-all placeholder:text-gray-300 dark:placeholder:text-gray-600"
                    placeholder="Enter current password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label htmlFor="newPassword" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">New Password</label>
                <div className="relative">
                  <input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 bg-white dark:bg-[#0a0a0a] rounded-xl border border-gray-200 dark:border-[#1a1a1a] text-sm font-medium text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 dark:focus:border-blue-400 outline-none transition-all placeholder:text-gray-300 dark:placeholder:text-gray-600"
                    placeholder="Enter new password (min 8 characters)"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Confirm New Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full px-4 py-3 bg-white dark:bg-[#0a0a0a] rounded-xl border text-sm font-medium text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/40 outline-none transition-all placeholder:text-gray-300 dark:placeholder:text-gray-600 ${
                    confirmPassword && confirmPassword !== newPassword
                      ? "border-red-300 dark:border-red-900/50 focus:border-red-500"
                      : "border-gray-200 dark:border-[#1a1a1a] focus:border-blue-500 dark:focus:border-blue-400"
                  }`}
                  placeholder="Confirm new password"
                  required
                />
                {confirmPassword && confirmPassword !== newPassword && (
                  <p className="mt-2 text-xs text-red-500 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Passwords do not match
                  </p>
                )}
              </div>

              {/* Password Requirements */}
              <div className="bg-gray-50/50 dark:bg-white/[0.02] rounded-xl p-4 border border-gray-100 dark:border-white/5">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Password Requirements</p>
                <ul className="space-y-1.5">
                  {[
                    { check: newPassword.length >= 8, text: "At least 8 characters" },
                    { check: /[A-Z]/.test(newPassword), text: "One uppercase letter" },
                    { check: /[a-z]/.test(newPassword), text: "One lowercase letter" },
                    { check: /[0-9]/.test(newPassword), text: "One digit" },
                    { check: /[^A-Za-z0-9]/.test(newPassword), text: "One special character" },
                  ].map((req) => (
                    <li key={req.text} className={`text-[11px] flex items-center gap-2 font-medium ${
                      !newPassword ? "text-gray-400" : req.check ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400"
                    }`}>
                      <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${
                        !newPassword ? "bg-gray-100 dark:bg-white/5" : req.check ? "bg-emerald-100 dark:bg-emerald-900/20" : "bg-gray-100 dark:bg-white/5"
                      }`}>
                        {req.check && newPassword && <Check className="w-2.5 h-2.5" />}
                      </div>
                      {req.text}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="px-8 py-6 border-t border-gray-100 dark:border-white/5 bg-gray-50/30 dark:bg-white/5 flex justify-end">
              <button
                type="submit"
                disabled={saving || !currentPassword || !newPassword || newPassword !== confirmPassword}
                className="inline-flex items-center px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-amber-500/25 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Shield className="w-4 h-4 mr-2" />}
                {saving ? "Updating..." : "Update Password"}
              </button>
            </div>
          </form>
        )}

        {/* Account Info Footer */}
        <div className="mt-10 flex items-center justify-between text-[10px] font-mono text-gray-300 dark:text-gray-700 px-2">
          <span>ID: {profile.id.substring(0, 8)}...</span>
          <span>Last Login: {profile.lastLoginAt ? formatDate(profile.lastLoginAt) : "N/A"}</span>
          <span>Status: {profile.status}</span>
        </div>
      </div>
    </div>
  );
}
