"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Bell, CheckCircle, AlertCircle, Info, MessageSquare, Download } from "lucide-react";
import { useEffect } from "react";

export type ToastType = "NOTIFICATION" | "SUCCESS" | "ERROR" | "INFO";

export interface ToastProps {
  id: string;
  title: string;
  message: string;
  type: ToastType;
  duration?: number;
  onClose: (id: string) => void;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
}

export function Toast({
  id,
  title,
  message,
  type,
  duration = 5000,
  onClose,
  action
}: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => onClose(id), duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case "NOTIFICATION": return <Bell className="w-5 h-5 text-blue-500" />;
      case "SUCCESS": return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case "ERROR": return <AlertCircle className="w-5 h-5 text-red-500" />;
      case "INFO": return <Info className="w-5 h-5 text-amber-500" />;
      default: return null;
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case "NOTIFICATION": return "border-blue-500/20";
      case "SUCCESS": return "border-emerald-500/20";
      case "ERROR": return "border-red-500/20";
      case "INFO": return "border-amber-500/20";
      default: return "border-white/10";
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className={`relative flex flex-col w-full max-w-sm bg-white/90 dark:bg-[#0a0a0a]/90 backdrop-blur-xl rounded-2xl shadow-2xl border ${getBorderColor()} overflow-hidden pointer-events-auto mb-4 group`}
    >
      <div className="p-4 flex gap-4">
        <div className="mt-1 flex-shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-white/5 flex items-center justify-center shadow-inner">
            {getIcon()}
          </div>
        </div>
        
        <div className="flex-1 min-w-0 pr-4">
          <h3 className="text-sm font-black text-gray-900 dark:text-gray-100 uppercase tracking-wide truncate">
            {title}
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">
            {message}
          </p>
          
          {action && (
            <div className="mt-3 flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  action.onClick();
                  onClose(id);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[10px] font-black uppercase tracking-widest rounded-lg hover:scale-105 transition-transform"
              >
                {action.icon || <Info size={12} />}
                {action.label}
              </button>
            </div>
          )}
        </div>

        <button
          onClick={() => onClose(id)}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-all opacity-0 group-hover:opacity-100"
        >
          <X size={14} />
        </button>
      </div>
      
      {/* Progress bar */}
      {duration > 0 && (
        <motion.div 
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: duration / 1000, ease: "linear" }}
          style={{ originX: 0 }}
          className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-50"
        />
      )}
    </motion.div>
  );
}

export function ToastContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed bottom-0 right-0 p-6 z-[9999] flex flex-col items-end pointer-events-none w-full max-w-sm">
      <AnimatePresence mode="popLayout">
        {children}
      </AnimatePresence>
    </div>
  );
}
