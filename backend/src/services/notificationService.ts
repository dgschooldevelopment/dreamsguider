import prisma from '../config/prisma';
import { emitNotificationToUser, emitNotificationToUsers } from './socket';

export interface CreateNotificationParams {
  userIds: string[];
  title: string;
  message: string;
  type: 'NEW_VIDEO' | 'COURSE_ALLOCATED' | 'ASSIGNMENT_GRADED' | 'ANNOUNCEMENT';
  link?: string;
}

export const createAndSendNotifications = async ({
  userIds,
  title,
  message,
  type,
  link,
}: CreateNotificationParams) => {
  if (!userIds || userIds.length === 0) return [];

  // Batch insert into database
  const notifications = await prisma.$transaction(
    userIds.map((userId) =>
      prisma.notification.create({
        data: {
          userId,
          title,
          message,
          type,
          link,
        },
      })
    )
  );

  // Real-time broadcast
  notifications.forEach((notif) => {
    emitNotificationToUser(notif.userId, notif);
  });

  return notifications;
};

// Notify all students enrolled in a specific course
export const notifyCourseEnrolledStudents = async (
  courseId: string,
  title: string,
  message: string,
  type: 'NEW_VIDEO' | 'ANNOUNCEMENT' = 'NEW_VIDEO',
  link?: string
) => {
  const enrollments = await prisma.enrollment.findMany({
    where: {
      courseId,
      status: 'ACTIVE',
    },
    select: {
      userId: true,
    },
  });

  const userIds = enrollments.map((e) => e.userId);
  if (userIds.length > 0) {
    return await createAndSendNotifications({
      userIds,
      title,
      message,
      type,
      link,
    });
  }
  return [];
};
