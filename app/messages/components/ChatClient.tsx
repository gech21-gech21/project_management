"use client";

import { useState, useEffect, useRef } from "react";
import { Send, User as UserIcon, Paperclip } from "lucide-react";
import { format } from "date-fns";

interface ChatUser {
  id: string;
  fullName: string;
  role: string;
  avatarUrl?: string | null;
}

interface ChatAttachment {
  id: string;
  filePath: string;
  originalFilename: string;
}

interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  createdAt: Date | string;
  isRead?: boolean;
  attachments?: ChatAttachment[];
}

export function ChatClient({ currentUser, contacts }: { currentUser: ChatUser, contacts: ChatUser[] }) {
  const [activeContact, setActiveContact] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Poll for messages
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeContact) {
      fetchMessages();
      interval = setInterval(fetchMessages, 5000);
    }
    return () => clearInterval(interval);
  }, [activeContact]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchMessages = async () => {
    if (!activeContact) return;
    try {
      const res = await fetch(`/api/messages?userId=${activeContact.id}`);
      const data = await res.json();
      if (data.data) {
        setMessages(data.data);
        
        // Mark as read if there are unread messages from this contact
        const hasUnread = data.data.some((m: ChatMessage) => !m.isRead && m.senderId === activeContact.id);
        if (hasUnread) {
          markAsRead(activeContact.id);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const markAsRead = async (senderId: string) => {
    try {
      await fetch("/api/messages/unread", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderId }),
      });
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const sendMessage = async (attachmentIds: string[] = []) => {
    if (!inputText.trim() && attachmentIds.length === 0) return;
    if (!activeContact) return;
    
    // Optimistic UI
    const pendingMsg = {
      id: "temp-" + Date.now(),
      content: inputText,
      senderId: currentUser.id,
      receiverId: activeContact.id,
      createdAt: new Date(),
      attachments: []
    };
    setMessages(prev => [...prev, pendingMsg]);
    const currentInput = inputText;
    setInputText("");

    try {
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: activeContact.id,
          content: currentInput || "Sent an attachment",
          attachmentIds
        })
      });
      fetchMessages();
    } catch (e) {
      console.error(e);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeContact) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error("Upload error details:", errorData.details);
        throw new Error(errorData.error + (errorData.details ? ": " + errorData.details : "") || "Server error");
      }

      const data = await res.json();
      if (data.success) {
        sendMessage([data.data.id]);
      }
    } catch (error) {
      console.error("Upload failed:", error);
      alert(error instanceof Error ? error.message : "Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-100px)] bg-white dark:bg-[#0a0a0a] rounded-2xl shadow-sm border border-gray-100 dark:border-[#1a1a1a] overflow-hidden max-w-7xl mx-auto">
      {/* Sidebar Contacts */}
      <div className="w-1/3 min-w-[250px] border-r border-gray-100 dark:border-white/5 flex flex-col">
        <div className="p-4 border-b border-gray-100 dark:border-white/5">
          <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Directory</h2>
        </div>
        <div className="overflow-y-auto flex-1 p-2 space-y-1">
          {contacts.map(contact => (
            <button
              key={contact.id}
              onClick={() => setActiveContact(contact)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeContact?.id === contact.id ? 'bg-blue-50 dark:bg-blue-500/10' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${activeContact?.id === contact.id ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                {contact.fullName.charAt(0)}
              </div>
              <div className="text-left flex-1 min-w-0">
                <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{contact.fullName}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest truncate">{contact.role.replace("_", " ")}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-50/50 dark:bg-[#050505]">
        {activeContact ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-white dark:bg-[#0a0a0a] border-b border-gray-100 dark:border-white/5 flex items-center gap-3 shadow-sm z-10">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                {activeContact.fullName.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white leading-tight">{activeContact.fullName}</h3>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest">Chat Open</p>
              </div>
            </div>

            {/* Chat Log */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.map(msg => {
                const isMine = msg.senderId === currentUser.id;
                return (
                  <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-2xl p-4 ${isMine ? 'bg-blue-500 text-white rounded-br-sm' : 'bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 border border-gray-100 dark:border-white/5 shadow-sm rounded-bl-sm'}`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {msg.attachments.map((att: ChatAttachment) => (
                            <a 
                              key={att.id} 
                              href={att.filePath} 
                              target="_blank" 
                              rel="noreferrer"
                              className={`flex items-center gap-2 p-2 rounded-lg text-xs font-bold transition-colors ${isMine ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20'}`}
                            >
                              <Paperclip size={12} /> {att.originalFilename}
                            </a>
                          ))}
                        </div>
                      )}
                      
                      <p className={`text-[9px] mt-2 font-mono ${isMine ? 'text-blue-200' : 'text-gray-400'}`}>
                        {format(new Date(msg.createdAt), "h:mm a")}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-4 bg-white dark:bg-[#0a0a0a] border-t border-gray-100 dark:border-white/5">
              <div className="flex items-end gap-2 bg-gray-50 dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-white/10 p-2 focus-within:border-blue-500 transition-colors">
                <label className="p-3 text-gray-400 hover:text-blue-500 transition-colors cursor-pointer rounded-xl hover:bg-white dark:hover:bg-black">
                  {isUploading ? <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /> : <Paperclip size={20} />}
                  <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                </label>
                <textarea 
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 max-h-32 min-h-[44px] bg-transparent border-none focus:ring-0 p-3 text-sm resize-none"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
                <button 
                  onClick={() => sendMessage()}
                  disabled={!inputText.trim()}
                  className="p-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <UserIcon size={48} className="mb-4 opacity-20" />
            <p className="text-sm font-bold uppercase tracking-widest">Select a contact to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}
