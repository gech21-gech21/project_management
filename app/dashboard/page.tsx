import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  Clock,
  TrendingUp,
  AlertCircle,
  Calendar,
  Activity,
} from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth");
  }

  const baseWhere = session.user.role === "ADMIN" ? {} : {
    OR: [
      { assignedToId: session.user.id },
      { createdById: session.user.id },
      {
        project: {
          OR: [
            { projectManagerId: session.user.id },
            {
              projectMembers: {
                some: {
                  userId: session.user.id,
                },
              },
            },
          ],
        },
      },
    ],
  };

  const projectWhere = session.user.role === "ADMIN" ? {} : {
    OR: [
      { projectManagerId: session.user.id },
      {
        projectMembers: {
          some: {
            userId: session.user.id,
          },
        },
      },
    ],
  };

  // Fetch dashboard data based on user role
  const [projects, tasks, teams, recentActivities] = await Promise.all([
    // Projects stats
    prisma.project.count({ where: projectWhere }),
    
    // Tasks stats
    prisma.task.count({ where: baseWhere }),
    
    // Teams count (only for admin and team leads)
    session.user.role !== "USER"
      ? prisma.team.count({
          where: session.user.role === "TEAMLEADER"
            ? { teamLeadId: session.user.id }
            : {},
        })
      : Promise.resolve(0),
    
    // Recent activities
    prisma.task.findMany({
      take: 5,
      orderBy: { updatedAt: "desc" },
      include: {
        assignedTo: {
          select: { id: true, fullName: true, email: true, avatarUrl: true },
        },
        project: {
          select: { id: true, name: true },
        },
      },
      where: baseWhere,
    }),
  ]);

  // Get tasks by status
  const tasksByStatus = await prisma.task.groupBy({
    by: ["status"],
    _count: { _all: true },
    where: baseWhere,
  });

  // Get upcoming deadlines (tasks due in the next 7 days)
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);

  const upcomingDeadlinesWhere: import("@prisma/client").Prisma.TaskWhereInput = {
    dueDate: {
      lte: nextWeek,
      gte: new Date(),
    },
    status: {
      not: "COMPLETED",
    },
  };

  if (session.user.role !== "ADMIN") {
    upcomingDeadlinesWhere.OR = baseWhere.OR;
  }

  const upcomingDeadlines = await prisma.task.findMany({
    where: upcomingDeadlinesWhere,
    take: 5,
    include: {
      assignedTo: {
        select: { id: true, fullName: true, email: true },
      },
      project: {
        select: { id: true, name: true },
      },
    },
    orderBy: { dueDate: "asc" },
  });

  const statusCounts = {
    TODO: tasksByStatus.find((s) => s.status === "TODO")?._count?._all || 0,
    IN_PROGRESS: tasksByStatus.find((s) => s.status === "IN_PROGRESS")?._count?._all || 0,
    REVIEW: tasksByStatus.find((s) => s.status === "REVIEW")?._count?._all || 0,
    COMPLETED: tasksByStatus.find((s) => s.status === "COMPLETED")?._count?._all || 0,
  };

  const statCards = [
    {
      title: "Total Projects",
      value: projects,
      icon: FolderKanban,
      color: "blue",
      change: "+12%",
      link: "/projects",
    },
    {
      title: "Total Tasks",
      value: tasks,
      icon: CheckSquare,
      color: "green",
      change: "+23%",
      link: "/tasks",
    },
    {
      title: "Active Teams",
      value: teams,
      icon: Users,
      color: "purple",
      change: "+5%",
      link: "/teams",
    },
    {
      title: "Completed Tasks",
      value: statusCounts.COMPLETED,
      icon: TrendingUp,
      color: "emerald",
      change: "+18%",
      link: "/tasks?status=COMPLETED",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {session.user?.name || session.user?.email?.split("@")[0]}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Here's what's happening with your projects today.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Calendar size={16} />
          <span>{new Date().toLocaleDateString("en-US", { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          const colorClasses = {
            blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
            green: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
            purple: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
            emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
          };

          return (
            <Link
              key={index}
              href={stat.link}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${colorClasses[stat.color as keyof typeof colorClasses]}`}>
                  <Icon size={24} />
                </div>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  {stat.change}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {stat.value}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {stat.title}
              </p>
            </Link>
          );
        })}
      </div>

      {/* Task Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Progress */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Task Progress
          </h2>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">To Do</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {statusCounts.TODO} tasks
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-500 rounded-full"
                  style={{
                    width: `${tasks ? (statusCounts.TODO / tasks) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">In Progress</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {statusCounts.IN_PROGRESS} tasks
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{
                    width: `${tasks ? (statusCounts.IN_PROGRESS / tasks) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">Review</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {statusCounts.REVIEW} tasks
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full"
                  style={{
                    width: `${tasks ? (statusCounts.REVIEW / tasks) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">Completed</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {statusCounts.COMPLETED} tasks
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full"
                  style={{
                    width: `${tasks ? (statusCounts.COMPLETED / tasks) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Upcoming Deadlines
            </h2>
            <Clock size={20} className="text-gray-400" />
          </div>
          <div className="space-y-4">
            {upcomingDeadlines.length > 0 ? (
              upcomingDeadlines.map((task) => (
                <Link
                  key={task.id}
                  href={`/tasks/${task.id}`}
                  className="block p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">
                        {task.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {task.project?.name}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-red-600 dark:text-red-400">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : ''}
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-8">
                <CheckSquare size={40} className="mx-auto text-gray-400 mb-3" />
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  No upcoming deadlines
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Activity
          </h2>
          <Activity size={20} className="text-gray-400" />
        </div>
        <div className="space-y-4">
          {recentActivities.length > 0 ? (
            recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckSquare size={16} className="text-gray-600 dark:text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white">
                    <span className="font-medium">
                      {activity.assignedTo?.fullName || "Someone"}
                    </span>{" "}
                    updated task{" "}
                    <span className="font-medium">{activity.title}</span>
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {new Date(activity.updatedAt).toLocaleDateString()} at{" "}
                    {new Date(activity.updatedAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Activity size={40} className="mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                No recent activity
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}