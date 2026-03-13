import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function ProjectDetailsPage({ params }: PageProps) {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/auth");
    }

    if (session.user.role !== "ADMIN") {
        redirect("/");
    }

    if (!id) {
        notFound();
    }

    const project = await prisma.project.findUnique({
        where: {
            id: id,
        },
        include: {
            projectManager: {
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    avatarUrl: true,
                },
            },
            _count: {
                select: {
                    tasks: true,
                    projectMembers: true,
                },
            },
        },
    });

    if (!project) {
        notFound();
    }

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-3xl font-bold">{project.name}</h1>

            <p className="text-gray-600">
                {project.description || "No description"}
            </p>

            <div className="grid grid-cols-2 gap-4 mt-6">

                <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <p className="font-semibold">{project.status}</p>
                </div>

                <div>
                    <p className="text-sm text-gray-500">Priority</p>
                    <p className="font-semibold">{project.priority}</p>
                </div>

                <div>
                    <p className="text-sm text-gray-500">Start Date</p>
                    <p>{project.startDate?.toDateString() || "N/A"}</p>
                </div>

                <div>
                    <p className="text-sm text-gray-500">End Date</p>
                    <p>{project.endDate?.toDateString() || "N/A"}</p>
                </div>

                <div>
                    <p className="text-sm text-gray-500">Tasks</p>
                    <p>{project._count.tasks}</p>
                </div>

                <div>
                    <p className="text-sm text-gray-500">Members</p>
                    <p>{project._count.projectMembers}</p>
                </div>

            </div>

            {project.projectManager && (
                <div className="mt-6">
                    <p className="text-sm text-gray-500">Project Manager</p>
                    <p className="font-semibold">
                        {project.projectManager.fullName || project.projectManager.email}
                    </p>
                </div>
            )}
        </div>
    );
}