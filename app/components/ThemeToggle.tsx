"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button 
        className="relative w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-[#111111] border border-gray-200 dark:border-[#1a1a1a] animate-pulse"
        aria-label="Toggle theme"
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-[#050505] border border-gray-200 dark:border-[#1a1a1a] hover:border-gray-300 dark:hover:border-[#2a2a2a] transition-colors duration-300 group overflow-hidden shadow-sm"
      aria-label="Toggle theme"
    >
      {!isDark ? (
        <div className="text-gray-600 group-hover:text-gray-900 transition-colors">
          <Sun size={15} strokeWidth={2.5} />
        </div>
      ) : (
        <div className="text-gray-400 group-hover:text-gray-100 transition-colors">
          <Moon size={14} strokeWidth={2.5} />
        </div>
      )}
      
      {/* Subtle background glow for dark mode */}
      {isDark && (
        <div className="absolute inset-0 bg-blue-500/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </button>
  );
}
