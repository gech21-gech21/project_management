import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

import { serializeBigInt } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const peerId = url.searchParams.get("userId");

    if (!peerId) {
      // Get latest conversations if no peerId
      return NextResponse.json({ messages: [] });
    }

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: session.user.id, receiverId: peerId },
          { senderId: peerId, receiverId: session.user.id }
        ]
      },
      orderBy: { createdAt: 'asc' },
      include: { attachments: true }
    });

    return NextResponse.json({ data: serializeBigInt(messages) });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { receiverId, content, attachmentIds } = await req.json();

    if (!receiverId || !content) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: {
        content,
        senderId: session.user.id,
        receiverId,
      }
    });

    // Link attachments if provided
    if (attachmentIds && attachmentIds.length > 0) {
      await prisma.attachment.updateMany({
        where: { id: { in: attachmentIds }, uploaderId: session.user.id },
        data: { messageId: message.id }
      });
    }

    const fullMessage = await prisma.message.findUnique({
      where: { id: message.id },
      include: { attachments: true }
    });

    // Trigger notification for recipient
    await createNotification({
      userId: receiverId,
      title: "New Message",
      message: `You received a new message from ${session.user.name || session.user.email}`,
      type: "NEW_MESSAGE",
      relatedId: session.user.id,
      relatedType: "MESSAGE",
    });

    return NextResponse.json({ data: serializeBigInt(fullMessage) });
  } catch (error) {
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
