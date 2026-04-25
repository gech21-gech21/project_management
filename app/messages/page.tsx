import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChatClient } from "./components/ChatClient";

export default async function MessagesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth");
  }

  // Fetch contacts (all active users for now, or could restrict by team)
  const contacts = await prisma.user.findMany({
    where: {
      id: { not: session.user.id }, // Exclude self
      status: "ACTIVE"
    },
    select: {
      id: true,
      fullName: true,
      role: true,
      avatarUrl: true
    },
    orderBy: {
      fullName: 'asc'
    }
  });

  return (
    <div className="py-6 px-4 bg-gray-50/30 dark:bg-[#050505] min-h-[calc(100vh-64px)]">
      <div className="max-w-7xl mx-auto mb-6">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Communications Hub</h1>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Direct Messaging & File Sharing</p>
      </div>
      <ChatClient 
        currentUser={{
          id: session.user.id,
          fullName: session.user.name || "Me",
          role: session.user.role,
          avatarUrl: session.user.image
        }} 
        contacts={contacts} 
      />
    </div>
  );
}
