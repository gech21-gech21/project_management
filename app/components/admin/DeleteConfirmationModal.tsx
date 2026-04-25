// components/admin/DeleteConfirmationModal.tsx
"use client";

interface DeleteConfirmationModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirmationModal({
  title,
  message,
  onConfirm,
  onCancel,
}: DeleteConfirmationModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-300">
      <div className="bg-white dark:bg-[#0a0a0a] rounded-3xl max-w-md w-full border border-gray-100 dark:border-white/10 shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="p-8">
          <div className="flex items-center justify-center w-20 h-20 mx-auto bg-rose-50 dark:bg-rose-500/10 rounded-full mb-6 relative group">
            <div className="absolute inset-0 rounded-full bg-rose-500/20 animate-ping group-hover:animate-none"></div>
            <div className="p-4 bg-rose-100 dark:bg-rose-500/20 rounded-full relative z-10">
              <svg className="w-8 h-8 text-rose-600 dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          
          <h3 className="text-2xl font-black text-gray-900 dark:text-white text-center mb-2 uppercase tracking-tighter italic">
            {title}
          </h3>
          
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 text-center mb-8 px-4">
            {message}
          </p>

          <div className="flex gap-4">
            <button
              onClick={onCancel}
              className="flex-1 px-6 py-4 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-900 dark:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
            >
              Abort Action
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-6 py-4 bg-rose-600 text-white rounded-2xl hover:bg-rose-700 transition-all text-[10px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(225,29,72,0.2)]"
            >
              Confirm Deletion
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
