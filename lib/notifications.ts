import { prisma } from "./prisma";
import { NotificationType } from "@prisma/client";

interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  relatedId?: string;
  relatedType?: string;
}

/**
 * Creates a notification for a specific user.
 */
export async function createNotification({
  userId,
  title,
  message,
  type,
  relatedId,
  relatedType,
}: CreateNotificationParams) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        relatedId,
        relatedType,
      },
    });
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    // We don't throw here to avoid failing the main request if notification fails
    return null;
  }
}

/**
 * Creates notifications for multiple users.
 */
export async function createManyNotifications(
  params: CreateNotificationParams[]
) {
  try {
    const notifications = await prisma.notification.createMany({
      data: params.map((p) => ({
        userId: p.userId,
        title: p.title,
        message: p.message,
        type: p.type,
        relatedId: p.relatedId,
        relatedType: p.relatedType,
      })),
    });
    return notifications;
  } catch (error) {
    console.error("Error creating many notifications:", error);
    return null;
  }
}
