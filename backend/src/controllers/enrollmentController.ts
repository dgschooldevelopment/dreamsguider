import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
import { createAndSendNotifications } from '../services/notificationService';

export const allocateCourseToUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId, courseId } = req.body;

    if (!userId || !courseId) {
      res.status(400).json({ success: false, message: 'userId and courseId are required.' });
      return;
    }

    const [user, course] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.course.findUnique({ where: { id: courseId } }),
    ]);

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }
    if (!course) {
      res.status(404).json({ success: false, message: 'Course not found.' });
      return;
    }

    // Upsert enrollment
    const enrollment = await prisma.enrollment.upsert({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      update: {
        status: 'ACTIVE',
      },
      create: {
        userId,
        courseId,
        status: 'ACTIVE',
      },
      include: {
        course: {
          select: {
            title: true,
            slug: true,
          },
        },
      },
    });

    // Notify student about course allocation
    await createAndSendNotifications({
      userIds: [userId],
      title: `Course Allocated: ${course.title}`,
      message: `Congratulations ${user.name}! You have been enrolled in "${course.title}". Start watching the lectures now.`,
      type: 'COURSE_ALLOCATED',
      link: `/learn/${course.slug}`,
    });

    res.status(200).json({
      success: true,
      message: `Successfully allocated "${course.title}" to ${user.name}`,
      data: enrollment,
    });
  } catch (error: any) {
    console.error('Allocate course error:', error);
    res.status(500).json({ success: false, message: 'Failed to allocate course' });
  }
};

export const batchAllocateCourses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userIds, courseIds } = req.body;

    if (!Array.isArray(userIds) || !Array.isArray(courseIds) || userIds.length === 0 || courseIds.length === 0) {
      res.status(400).json({ success: false, message: 'userIds and courseIds must be non-empty arrays.' });
      return;
    }

    const courses = await prisma.course.findMany({
      where: { id: { in: courseIds } },
    });

    for (const userId of userIds) {
      for (const course of courses) {
        await prisma.enrollment.upsert({
          where: {
            userId_courseId: {
              userId,
              courseId: course.id,
            },
          },
          update: { status: 'ACTIVE' },
          create: { userId, courseId: course.id, status: 'ACTIVE' },
        });

        await createAndSendNotifications({
          userIds: [userId],
          title: `Course Allocated: ${course.title}`,
          message: `You have been enrolled in "${course.title}". Begin your learning journey now!`,
          type: 'COURSE_ALLOCATED',
          link: `/learn/${course.slug}`,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Allocated ${courseIds.length} course(s) to ${userIds.length} user(s).`,
    });
  } catch (error: any) {
    console.error('Batch allocate error:', error);
    res.status(500).json({ success: false, message: 'Batch allocation failed' });
  }
};

export const revokeCourseAccess = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId, courseId } = req.body;

    await prisma.enrollment.updateMany({
      where: { userId, courseId },
      data: { status: 'REVOKED' },
    });

    res.status(200).json({ success: true, message: 'Course access revoked.' });
  } catch (error: any) {
    console.error('Revoke access error:', error);
    res.status(500).json({ success: false, message: 'Failed to revoke access' });
  }
};

export const getAllEnrollments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const enrollments = await prisma.enrollment.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    });

    res.status(200).json({ success: true, data: enrollments });
  } catch (error: any) {
    console.error('Get enrollments error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch enrollments' });
  }
};
