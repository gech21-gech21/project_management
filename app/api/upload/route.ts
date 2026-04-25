import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { writeFile, mkdir } from "node:fs/promises";
import fs from "node:fs";
import path from "node:path";

import { serializeBigInt } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    // Normalize IDs: treat empty strings as null to satisfy Prisma
    const taskId = (formData.get("taskId") as string) || null;
    const projectId = (formData.get("projectId") as string) || null;
    const messageId = (formData.get("messageId") as string) || null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const originalFilename = file.name;
    const safeFilename = `${Date.now()}-${originalFilename.replace(/[^a-zA-Z0-9.\-_]/g, "")}`;
    const publicUrl = `/uploads/attachments/${safeFilename}`;

    // Ensure directory exists
    const uploadDir = path.join(process.cwd(), "public", "uploads", "attachments");
    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, safeFilename);

    // Write file to disk asynchronously
    await writeFile(filePath, buffer);

    // Save metadata to DB
    const attachment = await prisma.attachment.create({
      data: {
        filename: safeFilename,
        originalFilename,
        filePath: publicUrl,
        fileSize: BigInt(file.size), // Explicit BigInt conversion
        mimeType: file.type,
        uploaderId: session.user.id,
        taskId,
        projectId,
        messageId,
      },
    });

    // Notify relevant users
    try {
      if (taskId) {
        const task = await prisma.task.findUnique({
          where: { id: taskId },
          select: { title: true, assignedToId: true }
        });
        if (task?.assignedToId && task.assignedToId !== session.user.id) {
          await createNotification({
            userId: task.assignedToId,
            title: "New File Uploaded to Task",
            message: `${session.user.name || 'A user'} uploaded a file to task: "${task.title}"`,
            type: "FILE_UPLOAD",
            relatedId: taskId,
            relatedType: "TASK",
          });
        }
      } else if (projectId) {
        const project = await prisma.project.findUnique({
          where: { id: projectId },
          select: { name: true, projectManagerId: true }
        });
        if (project?.projectManagerId && project.projectManagerId !== session.user.id) {
          await createNotification({
            userId: project.projectManagerId,
            title: "New File Uploaded to Project",
            message: `${session.user.name || 'A user'} uploaded a file to project: "${project.name}"`,
            type: "FILE_UPLOAD",
            relatedId: projectId,
            relatedType: "PROJECT",
          });
        }
      }
    } catch (err) {
      console.error("Failed to send upload notification:", err);
    }

    return NextResponse.json({ success: true, data: serializeBigInt(attachment) });
  } catch (error) {
    console.error("Upload error detail:", error);
    return NextResponse.json({ 
      error: "Failed to upload file", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
