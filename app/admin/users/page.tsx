import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserCircle, Mail, Shield, UserPlus } from "lucide-react";

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-gray-600 dark:text-gray-400">View and manage system users and roles.</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <UserPlus size={18} />
          Add User
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => (
          <div key={user.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 flex items-start gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl ${
              user.role === 'ADMIN' ? 'bg-purple-500' :
              user.role === 'TEAMLEADER' ? 'bg-blue-500' :
              'bg-green-500'
            }`}>
              {user.fullName ? user.fullName[0] : (user.email ? user.email[0].toUpperCase() : "?")}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 dark:text-white truncate">{user.fullName}</h3>
              <p className="text-sm text-gray-500 truncate flex items-center gap-1">
                <Mail size={12} />
                {user.email}
              </p>
              <div className="mt-4 flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                  user.role === 'TEAMLEADER' ? 'bg-blue-100 text-blue-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {user.role}
                </span>
                <span className="text-[10px] text-gray-400">
                  Joined {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
