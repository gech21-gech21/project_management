import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  if (!q) {
    return NextResponse.json({ tasks: [], projects: [], users: [] });
  }

  try {
    const [tasks, projects, users] = await Promise.all([
      prisma.task.findMany({
        where: { title: { contains: q } },
        take: 5,
        select: { id: true, title: true }
      }),
      prisma.project.findMany({
        where: { name: { contains: q } },
        take: 5,
        select: { id: true, name: true }
      }),
      prisma.user.findMany({
        where: { fullName: { contains: q } },
        take: 5,
        select: { id: true, fullName: true, email: true }
      })
    ]);

    return NextResponse.json({ tasks, projects, users });
  } catch (error) {
    console.error("Search API Error:", error);
    return NextResponse.json({ error: "Failed to search" }, { status: 500 });
  }
}
