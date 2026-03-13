import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Calendar, User, MessageSquare, Plus } from "lucide-react";
import { CreateTaskButton } from "./components/create-task-button";

export default async function TeamLeaderTasksPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth");
  }

  if (session.user.role !== "TEAMLEADER") {
    redirect("/dashboard");
  }

  // Fetch all tasks from projects managed by this team leader
  const tasks = await prisma.task.findMany({
    where: {
      project: {
        projectManagerId: session.user.id,
      },
    },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      assignedTo: {
        select: {
          id: true,
          fullName: true,
          email: true,
          avatarUrl: true,
        },
      },
      _count: {
        select: {
          comments: true,
        },
      },
    },
    orderBy: [
      {
        status: 'asc',
      },
      {
        dueDate: 'asc',
      },
    ],
  });

  // Fetch projects for the create task form
  const projects = await prisma.project.findMany({
    where: {
      projectManagerId: session.user.id,
    },
    select: {
      id: true,
      name: true,
      code: true,
    },
  });

  // Fetch team members (users in the team lead's team)
  const team = await prisma.team.findFirst({
    where: {
      teamLeadId: session.user.id
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              avatarUrl: true,
            }
          }
        }
      }
    }
  });

  const teamMembers = team?.members.map(member => member.user) || [];

  // Group tasks by status
  const groupedTasks = {
    TODO: tasks.filter(t => t.status === "TODO"),
    IN_PROGRESS: tasks.filter(t => t.status === "IN_PROGRESS"),
    REVIEW: tasks.filter(t => t.status === "REVIEW"),
    COMPLETED: tasks.filter(t => t.status === "COMPLETED"),
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "TODO":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "REVIEW":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "COMPLETED":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "bg-red-100 text-red-800";
      case "HIGH":
        return "bg-orange-100 text-orange-800";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800";
      case "LOW":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "No due date";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Create Button */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Task Management</h1>
            <p className="mt-2 text-gray-600">
              View and manage all tasks across your projects
            </p>
          </div>
          <CreateTaskButton 
            projects={projects} 
            teamMembers={teamMembers}
            teamLeadId={session.user.id}
          />
        </div>

        {/* Task Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-gray-400">
            <p className="text-sm text-gray-600">To Do</p>
            <p className="text-2xl font-bold text-gray-900">{groupedTasks.TODO.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-400">
            <p className="text-sm text-blue-600">In Progress</p>
            <p className="text-2xl font-bold text-blue-900">{groupedTasks.IN_PROGRESS.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-yellow-400">
            <p className="text-sm text-yellow-600">Review</p>
            <p className="text-2xl font-bold text-yellow-900">{groupedTasks.REVIEW.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-400">
            <p className="text-sm text-green-600">Completed</p>
            <p className="text-2xl font-bold text-green-900">{groupedTasks.COMPLETED.length}</p>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* TODO Column */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h2 className="font-semibold text-gray-700 mb-4 flex items-center">
              <span className="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
              To Do ({groupedTasks.TODO.length})
            </h2>
            <div className="space-y-3">
              {groupedTasks.TODO.map((task) => (
                <Link
                  key={task.id}
                  href={`/teamleader/tasks/${task.id}`}
                  className="block bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-all border border-gray-200"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-900">{task.title}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">
                    Project: {task.project.name}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-gray-500">
                      <User className="w-4 h-4 mr-1" />
                      <span className="text-xs">
                        {task.assignedTo?.fullName || "Unassigned"}
                      </span>
                    </div>
                    <div className="flex items-center text-gray-500">
                      <MessageSquare className="w-4 h-4 mr-1" />
                      <span className="text-xs">{task._count.comments}</span>
                    </div>
                  </div>
                  
                  {task.dueDate && (
                    <div className="mt-2 flex items-center text-xs text-gray-500">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDate(task.dueDate)}
                    </div>
                  )}
                </Link>
              ))}
              
              {groupedTasks.TODO.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No tasks to do</p>
              )}
            </div>
          </div>

          {/* IN PROGRESS Column */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h2 className="font-semibold text-blue-700 mb-4 flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
              In Progress ({groupedTasks.IN_PROGRESS.length})
            </h2>
            <div className="space-y-3">
              {groupedTasks.IN_PROGRESS.map((task) => (
                <Link
                  key={task.id}
                  href={`/teamleader/tasks/${task.id}`}
                  className="block bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-all border border-blue-200"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-900">{task.title}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">
                    Project: {task.project.name}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-gray-500">
                      <User className="w-4 h-4 mr-1" />
                      <span className="text-xs">
                        {task.assignedTo?.fullName || "Unassigned"}
                      </span>
                    </div>
                    <div className="flex items-center text-gray-500">
                      <MessageSquare className="w-4 h-4 mr-1" />
                      <span className="text-xs">{task._count.comments}</span>
                    </div>
                  </div>
                  
                  {task.dueDate && (
                    <div className="mt-2 flex items-center text-xs text-gray-500">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDate(task.dueDate)}
                    </div>
                  )}
                </Link>
              ))}
              
              {groupedTasks.IN_PROGRESS.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No tasks in progress</p>
              )}
            </div>
          </div>

          {/* REVIEW Column */}
          <div className="bg-yellow-50 rounded-lg p-4">
            <h2 className="font-semibold text-yellow-700 mb-4 flex items-center">
              <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
              Review ({groupedTasks.REVIEW.length})
            </h2>
            <div className="space-y-3">
              {groupedTasks.REVIEW.map((task) => (
                <Link
                  key={task.id}
                  href={`/teamleader/tasks/${task.id}`}
                  className="block bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-all border border-yellow-200"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-900">{task.title}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">
                    Project: {task.project.name}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-gray-500">
                      <User className="w-4 h-4 mr-1" />
                      <span className="text-xs">
                        {task.assignedTo?.fullName || "Unassigned"}
                      </span>
                    </div>
                    <div className="flex items-center text-gray-500">
                      <MessageSquare className="w-4 h-4 mr-1" />
                      <span className="text-xs">{task._count.comments}</span>
                    </div>
                  </div>
                  
                  {task.dueDate && (
                    <div className="mt-2 flex items-center text-xs text-gray-500">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDate(task.dueDate)}
                    </div>
                  )}
                </Link>
              ))}
              
              {groupedTasks.REVIEW.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No tasks in review</p>
              )}
            </div>
          </div>

          {/* COMPLETED Column */}
          <div className="bg-green-50 rounded-lg p-4">
            <h2 className="font-semibold text-green-700 mb-4 flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Completed ({groupedTasks.COMPLETED.length})
            </h2>
            <div className="space-y-3">
              {groupedTasks.COMPLETED.map((task) => (
                <Link
                  key={task.id}
                  href={`/teamleader/tasks/${task.id}`}
                  className="block bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-all border border-green-200"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-900 line-through text-gray-500">
                      {task.title}
                    </h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-500 mb-3">
                    Project: {task.project.name}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-gray-400">
                      <User className="w-4 h-4 mr-1" />
                      <span className="text-xs">
                        {task.assignedTo?.fullName || "Unassigned"}
                      </span>
                    </div>
                    <div className="flex items-center text-gray-400">
                      <MessageSquare className="w-4 h-4 mr-1" />
                      <span className="text-xs">{task._count.comments}</span>
                    </div>
                  </div>
                </Link>
              ))}
              
              {groupedTasks.COMPLETED.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No completed tasks</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}