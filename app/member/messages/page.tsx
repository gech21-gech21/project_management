import { MessageSquare } from "lucide-react";

export default function MemberMessagesPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Messages Coming Soon</h2>
        <p className="text-gray-600">The internal messaging system is under development. Stay tuned!</p>
      </div>
    </div>
  );
}
