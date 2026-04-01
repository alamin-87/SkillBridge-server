import { prisma } from "../../lib/prisma";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";
type NotificationType = "BOOKING" | "PAYMENT" | "SYSTEM" | "ASSIGNMENT";

export const NotificationService = {
  // Utility handler that can be reused by Booking/Payment modules securely
  createNotification: async (
    userId: string,
    title: string,
    message: string,
    type: NotificationType
  ) => {
    return prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
      },
    });
  },

  getUserNotifications: async (userId: string) => {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  },

  markNotificationAsRead: async (notificationId: string, userId: string) => {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new AppError(
        status.NOT_FOUND,
        "System notification natively not found"
      );
    }

    if (notification.userId !== userId) {
      throw new AppError(
        status.FORBIDDEN,
        "Denial: Modification attempting unauthorized access natively mapping."
      );
    }

    return prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  },

  markAllAsRead: async (userId: string) => {
    const { count } = await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    return { markedCount: count };
  },
};
