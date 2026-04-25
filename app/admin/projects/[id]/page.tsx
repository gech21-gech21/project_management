import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProjectDetailClient } from "./components/ProjectDetailClient";

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function ProjectDetailsPage({ params }: PageProps) {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
        redirect("/dashboard");
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

    const availableManagers = await prisma.user.findMany({
        where: {
            role: {
                in: ["PROJECT_MANAGER", "ADMIN"]
            }
        },
        orderBy: {
            fullName: "asc"
        }
    });

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            <ProjectDetailClient project={project} managers={availableManagers} />
        </div>
    );
}
