"use client";

import React from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { 
  Github, 
  Twitter, 
  Linkedin, 
  Shield, 
  Zap, 
  Heart, 
  HelpCircle, 
  Book,
  Globe,
  Lock,
  Terminal,
  Activity,
  FolderKanban,
  Users,
  Settings,
  BarChart3
} from "lucide-react";

export default function Footer() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const currentYear = new Date().getFullYear();

  const renderRoleContent = () => {
    switch (role) {
      case "ADMIN":
        return (
          <div className="flex flex-wrap gap-8">
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white mb-4">Command Center</h4>
              <ul className="space-y-2 text-sm font-normal text-white/70">
                <li><Link href="/admin/settings" className="hover:text-white transition-colors">Global Parameters</Link></li>
                <li><Link href="/admin/users" className="hover:text-white transition-colors">Neural Access Control</Link></li>
                <li><Link href="/admin/analytics" className="hover:text-white transition-colors">Operational Intelligence</Link></li>
                <li><Link href="/logs" className="hover:text-white transition-colors">System Entropy Logs</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white mb-4">Infrastructure</h4>
              <div className="flex items-center gap-3 px-4 py-2 bg-white/10 border border-white/10 rounded-xl">
                <Activity size={12} className="text-emerald-400 animate-pulse" />
                <span className="text-xs font-medium text-emerald-400">Core Engine: Stable</span>
              </div>
              <div className="flex items-center gap-3 px-4 py-2 bg-white/10 border border-white/10 rounded-xl">
                <Terminal size={12} className="text-blue-300" />
                <span className="text-xs font-medium text-blue-300">v2.4.0-Enterprise</span>
              </div>
            </div>
          </div>
        );
      case "PROJECT_MANAGER":
        return (
          <div className="flex flex-wrap gap-8">
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white mb-4">Managerial Nexus</h4>
              <ul className="space-y-2 text-sm font-normal text-white/70">
                <li><Link href="/manager/projects" className="hover:text-white transition-colors">Portfolio Strategy</Link></li>
                <li><Link href="/manager/team" className="hover:text-white transition-colors">Resource Optimization</Link></li>
                <li><Link href="/manager/reports" className="hover:text-white transition-colors">Velocity Analysis</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white mb-4">Team Pulse</h4>
              <div className="flex items-center gap-3 px-4 py-2 bg-white/10 border border-white/10 rounded-xl">
                <Zap size={12} className="text-purple-300" />
                <span className="text-xs font-medium text-purple-300">Velocity: 94%</span>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="flex flex-wrap gap-8">
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white mb-4">Member Portal</h4>
              <ul className="space-y-2 text-sm font-normal text-white/70">
                <li><Link href="/member/tasks" className="hover:text-white transition-colors">Objective Queue</Link></li>
                <li><Link href="/member/team" className="hover:text-white transition-colors">Node Directory</Link></li>
                <li><Link href="/help" className="hover:text-white transition-colors">Operational Support</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white mb-4">Community</h4>
              <div className="flex items-center gap-3">
                <Link href="#" className="p-2 bg-white/10 rounded-lg text-white/60 hover:text-white transition-all"><Twitter size={14} /></Link>
                <Link href="#" className="p-2 bg-white/10 rounded-lg text-white/60 hover:text-white transition-all"><Github size={14} /></Link>
                <Link href="#" className="p-2 bg-white/10 rounded-lg text-white/60 hover:text-white transition-all"><Linkedin size={14} /></Link>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <footer className="bg-gray-500 text-white mt-12 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          {/* Brand Section */}
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shadow-lg">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                Project<span className="text-blue-200">Flow</span>
              </span>
            </div>
            <p className="text-sm font-normal text-white/70 leading-relaxed mb-6">
              The ultimate organizational nexus for modern teams. Streamline operations, optimize node throughput, and scale your infrastructure with surgical precision.
            </p>
            <div className="flex items-center gap-4 text-xs font-medium text-white/60">
              <div className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer">
                <Globe size={12} />
                Global Network
              </div>
              <div className="w-1 h-1 rounded-full bg-white/20" />
              <div className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer">
                <Lock size={12} />
                Encrypted
              </div>
            </div>
          </div>

          {/* Role-Based Content */}
          <div className="flex justify-start lg:justify-end">
            {renderRoleContent()}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-xs font-normal text-white/60">
            <span>© {currentYear} ProjectFlow Systems Inc.</span>
            <div className="w-1 h-1 rounded-full bg-white/20" />
            <span className="flex items-center gap-1">Made with <Heart size={10} className="text-rose-300 fill-rose-300" /> for elite teams</span>
          </div>
          
          <div className="flex items-center gap-6 text-xs font-normal text-white/60">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/security" className="hover:text-white transition-colors">Security</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
