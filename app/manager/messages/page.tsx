import { MessageSquare } from "lucide-react";

export default function PROJECT_MANAGERMessagesPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <MessageSquare className="w-10 h-10 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Team Messaging</h2>
        <p className="text-gray-600">The team communication system is currently being integrated. Check back soon for updates!</p>
      </div>
    </div>
  );
}
