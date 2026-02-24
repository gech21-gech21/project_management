"use client";

import { useRouter } from "next/navigation";
import { Calendar, Users, Clock, ChevronRight } from "lucide-react";

import { Project } from "@prisma/client";
type ProjectWithDetails = Project & {
  teamLead?: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  } | null;
  department?: {
    id: string;
    name: string;
  } | null;
  _count: {
    tasks: number;
    teamMembers: number;
  };
};

interface ProjectCardProps {
  project: ProjectWithDetails;
  status: {
    color: string;
    icon: React.ElementType;
    label: string;
  };
  StatusIcon: React.ElementType;
}

export function ProjectCard({ project, status, StatusIcon }: ProjectCardProps) {
  const router = useRouter();

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getProgress = () => {
    if (project._count.tasks === 0) return 0;
    // This is simplified - you might want to calculate based on completed tasks
    return 0;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      LOW: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      MEDIUM:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      HIGH: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
      URGENT: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    };
    return colors[priority as keyof typeof colors] || colors.MEDIUM;
  };

  return (
    <div
      onClick={() => router.push(`/admin/projects/${project.id}`)}
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            {project.name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {project.description || "No description provided"}
          </p>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
      </div>

      {/* Status and Priority */}
      <div className="flex items-center gap-2 mb-4">
        <span
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${status.color}`}
        >
          <StatusIcon className="w-3 h-3" />
          {status.label}
        </span>
        <span
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${getPriorityColor(
            project.priority,
          )}`}
        >
          {project.priority}
        </span>
      </div>

      {/* Team Lead */}
      {project.teamLead && (
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden shrink-0">
            {project.teamLead.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={project.teamLead.image}
                alt={project.teamLead.name || ""}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300">
                {(project.teamLead.name ||
                  project.teamLead.email)[0].toUpperCase()}
              </div>
            )}
          </div>
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Lead: {project.teamLead.name || project.teamLead.email}
          </span>
        </div>
      )}

      {/* Dates */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <Calendar className="w-4 h-4 mr-2" />
          <span>Start: {formatDate(project.startDate)}</span>
        </div>
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <Calendar className="w-4 h-4 mr-2" />
          <span>End: {formatDate(project.endDate)}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <Users className="w-4 h-4" />
          <span>{project._count.teamMembers} members</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          <span>{project._count.tasks} tasks</span>
        </div>
      </div>

      {/* Progress Bar (simplified) */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-gray-600 dark:text-gray-400">Progress</span>
          <span className="text-gray-900 dark:text-white">
            {getProgress()}%
          </span>
        </div>
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full"
            style={{ width: `${getProgress()}%` }}
          />
        </div>
      </div>
    </div>
  );
}
