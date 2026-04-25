import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  MessageSquare,
  History,
  Shield,
  User
} from "lucide-react";
import { PROJECT_MANAGERTaskInteraction } from "./task-detail-client";

export default async function PROJECT_MANAGERTaskDetailsPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const session = await getServerSession(authOptions);
  const { taskId } = await params;

  if (!session) {
    redirect("/auth");
  }

  if (session.user.role !== "PROJECT_MANAGER" && session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const task = await prisma.task.findUnique({
    where: {
      id: taskId,
    },
    include: {
      project: {
        include: {
          team: true
        }
      },
      assignedTo: {
        select: {
          id: true,
          fullName: true,
          email: true,
          avatarUrl: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          fullName: true,
          avatarUrl: true,
        },
      },
      comments: {
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!task) {
    notFound();
  }

  // Verify permission: Must be project manager OR the team lead of the assigned team
  const isProjectManager = task.project.projectManagerId === session.user.id;
  const isTeamLead = task.project.team?.teamLeadId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";

  if (!isProjectManager && !isTeamLead && !isAdmin) {
    redirect("/manager/tasks");
  }

  // Fetch team members for the assignment dropdown
  let teamMembers: any[] = [];
  if (task.project.teamId) {
      const team = await prisma.team.findUnique({
          where: { id: task.project.teamId },
          include: {
              members: {
                  include: {
                      user: {
                          select: {
                              id: true,
                              fullName: true,
                          }
                      }
                  }
              }
          }
      });
      teamMembers = team?.members.map(m => m.user) || [];
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT": return "text-red-700 bg-red-50 border-red-200";
      case "HIGH": return "text-orange-700 bg-orange-50 border-orange-200";
      case "MEDIUM": return "text-yellow-700 bg-yellow-50 border-yellow-200";
      case "LOW": return "text-blue-700 bg-blue-50 border-blue-200";
      default: return "text-gray-700 bg-gray-50 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "TODO": return "text-gray-700 bg-gray-100";
      case "IN_PROGRESS": return "text-blue-700 bg-blue-100";
      case "REVIEW": return "text-purple-700 bg-purple-100";
      case "COMPLETED": return "text-green-700 bg-green-100";
      default: return "text-gray-700 bg-gray-100";
    }
  };

  return (
    <div className="">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Link */}
        <Link 
          href="/manager/tasks"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Tasks
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-8">
                <div className="flex items-center gap-3 mb-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getStatusColor(task.status)}`}>
                    {task.status.replace("_", " ")}
                  </span>
                </div>
                
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{task.title}</h1>
                
                <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-8 pb-8 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                      <Shield className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Project</p>
                      <p className="font-semibold text-gray-700">{task.project.name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Due Date</p>
                      <p className="font-semibold text-gray-700">
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                      <User className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Assignee</p>
                      <p className="font-semibold text-gray-700">{task.assignedTo?.fullName || 'Unassigned'}</p>
                    </div>
                  </div>
                </div>

                <div className="prose prose-blue max-w-none">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Description</h3>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {task.description || "No description provided."}
                  </p>
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-gray-400" />
                Comments ({task.comments.length})
              </h3>
              
              <div className="space-y-6">
                {task.comments.map((comment) => (
                  <div key={comment.id} className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0 flex items-center justify-center text-gray-500 font-bold">
                      {comment.user.fullName[0]}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-gray-900 text-sm">{comment.user.fullName}</span>
                        <span className="text-xs text-gray-400">{new Date(comment.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-xl rounded-tl-none border border-gray-100">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))}
                
                {task.comments.length === 0 && (
                  <p className="text-center text-gray-400 py-8 text-sm italic">No comments yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <PROJECT_MANAGERTaskInteraction 
              taskId={task.id} 
              initialStatus={task.status} 
              teamMembers={teamMembers}
              initialAssigneeId={task.assignedToId}
            />

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h4 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Created By</h4>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                  {task.createdBy?.fullName?.[0] || 'A'}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{task.createdBy?.fullName || 'Admin'}</p>
                  <p className="text-xs text-gray-500">Project Manager</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h4 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Timeline</h4>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-gray-500 text-xs">Created At</p>
                    <p className="font-medium text-gray-700">{new Date(task.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <History className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-gray-500 text-xs">Last Updated</p>
                    <p className="font-medium text-gray-700">{new Date(task.updatedAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
