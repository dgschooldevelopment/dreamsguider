import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';

export const getAdminStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [
      totalStudents,
      totalCourses,
      totalTopics,
      totalEnrollments,
      totalSubmissions,
      pendingSubmissions,
      recentEnrollments,
      recentUsers,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.course.count(),
      prisma.topic.count(),
      prisma.enrollment.count(),
      prisma.assignmentSubmission.count(),
      prisma.assignmentSubmission.count({ where: { status: 'PENDING' } }),
      prisma.enrollment.findMany({
        take: 5,
        orderBy: { enrolledAt: 'desc' },
        include: {
          user: { select: { name: true, email: true } },
          course: { select: { title: true } },
        },
      }),
      prisma.user.findMany({
        take: 5,
        where: { role: 'STUDENT' },
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, email: true, createdAt: true },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalStudents,
        totalCourses,
        totalTopics,
        totalEnrollments,
        totalSubmissions,
        pendingSubmissions,
        recentEnrollments,
        recentUsers,
      },
    });
  } catch (error: any) {
    console.error('Stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch admin stats' });
  }
};
