import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';

// Helper to generate slug
const generateSlug = (text: string) => {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-') + '-' + Math.floor(1000 + Math.random() * 9000);
};

export const getAllCourses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const isAdmin = req.user?.role === 'ADMIN';

    const courses = await prisma.course.findMany({
      where: isAdmin ? {} : { isPublished: true },
      include: {
        _count: {
          select: {
            enrollments: true,
            modules: true,
            assignments: true,
          },
        },
        modules: {
          select: {
            id: true,
            topics: {
              select: {
                id: true,
                duration: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Compute total topics and total duration for each course
    const formattedCourses = courses.map((course) => {
      let totalTopics = 0;
      let totalDurationSec = 0;

      course.modules.forEach((mod) => {
        totalTopics += mod.topics.length;
        mod.topics.forEach((top) => {
          totalDurationSec += top.duration || 0;
        });
      });

      const { modules, ...rest } = course;
      return {
        ...rest,
        stats: {
          totalModules: course._count.modules,
          totalTopics,
          totalDurationSec,
          totalEnrollments: course._count.enrollments,
          totalAssignments: course._count.assignments,
        },
      };
    });

    res.status(200).json({ success: true, data: formattedCourses });
  } catch (error: any) {
    console.error('Get all courses error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch courses' });
  }
};

export const getMyCourses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId: req.user.userId,
        status: 'ACTIVE',
      },
      include: {
        course: {
          include: {
            modules: {
              include: {
                topics: {
                  select: {
                    id: true,
                    duration: true,
                  },
                },
              },
            },
            assignments: {
              select: {
                id: true,
              },
            },
          },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    });

    // Fetch user progress for topics
    const userProgress = await prisma.topicProgress.findMany({
      where: {
        userId: req.user.userId,
        isCompleted: true,
      },
      select: {
        topicId: true,
      },
    });

    const completedTopicIds = new Set(userProgress.map((p) => p.topicId));

    const enrolledCourses = enrollments.map((enr) => {
      const course = enr.course;
      let totalTopics = 0;
      let completedTopics = 0;
      let totalDurationSec = 0;

      course.modules.forEach((mod) => {
        totalTopics += mod.topics.length;
        mod.topics.forEach((t) => {
          totalDurationSec += t.duration || 0;
          if (completedTopicIds.has(t.id)) {
            completedTopics++;
          }
        });
      });

      const progressPercent = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

      return {
        enrollmentId: enr.id,
        enrolledAt: enr.enrolledAt,
        status: enr.status,
        progressPercent,
        completedTopics,
        totalTopics,
        totalDurationSec,
        totalAssignments: course.assignments.length,
        course: {
          id: course.id,
          title: course.title,
          slug: course.slug,
          description: course.description,
          thumbnail: course.thumbnail,
          category: course.category,
          level: course.level,
        },
      };
    });

    res.status(200).json({ success: true, data: enrolledCourses });
  } catch (error: any) {
    console.error('Get my courses error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch enrolled courses' });
  }
};

export const getCourseDetail = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { idOrSlug } = req.params;
    const userId = req.user?.userId;
    const isAdmin = req.user?.role === 'ADMIN';

    const course = await prisma.course.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      include: {
        modules: {
          orderBy: { order: 'asc' },
          include: {
            topics: {
              orderBy: { order: 'asc' },
              include: {
                assignments: true,
              },
            },
          },
        },
        assignments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!course) {
      res.status(404).json({ success: false, message: 'Course not found' });
      return;
    }

    // Check if current user is enrolled
    let isEnrolled = false;
    let enrollment = null;
    let userProgressMap: Record<string, { isCompleted: boolean; lastWatchedSec: number }> = {};

    if (userId) {
      enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId: course.id,
          },
        },
      });

      isEnrolled = !!enrollment && enrollment.status === 'ACTIVE';

      // Load progress
      const progresses = await prisma.topicProgress.findMany({
        where: { userId },
      });
      progresses.forEach((p) => {
        userProgressMap[p.topicId] = {
          isCompleted: p.isCompleted,
          lastWatchedSec: p.lastWatchedSec,
        };
      });
    }

    // Non-admin and not enrolled users shouldn't have access to full video urls if restricted
    const sanitizedModules = course.modules.map((mod) => ({
      ...mod,
      topics: mod.topics.map((t) => {
        const p = userProgressMap[t.id];
        return {
          ...t,
          isCompleted: p ? p.isCompleted : false,
          lastWatchedSec: p ? p.lastWatchedSec : 0,
          // If not admin and not enrolled, hide direct video stream if desired, or allow preview of first topic
          videoUrl: isAdmin || isEnrolled ? t.videoUrl : (mod.order === 0 && t.order === 0 ? t.videoUrl : null),
          isLocked: !isAdmin && !isEnrolled && !(mod.order === 0 && t.order === 0),
        };
      }),
    }));

    res.status(200).json({
      success: true,
      data: {
        ...course,
        modules: sanitizedModules,
        isEnrolled: isAdmin || isEnrolled,
        enrollment,
      },
    });
  } catch (error: any) {
    console.error('Get course detail error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch course detail' });
  }
};

export const createCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, category, level, duration, isPublished } = req.body;

    if (!title || !description) {
      res.status(400).json({ success: false, message: 'Title and description are required.' });
      return;
    }

    const slug = generateSlug(title);
    let thumbnail = req.body.thumbnail;
    if (req.file) {
      thumbnail = `/uploads/thumbnails/${req.file.filename}`;
    }

    const course = await prisma.course.create({
      data: {
        title,
        slug,
        description,
        thumbnail: thumbnail || null,
        category: category || 'Web Development',
        level: level || 'Beginner',
        duration: duration || null,
        isPublished: isPublished === 'true' || isPublished === true,
      },
    });

    res.status(201).json({ success: true, message: 'Course created successfully', data: course });
  } catch (error: any) {
    console.error('Create course error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to create course' });
  }
};

export const updateCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, category, level, duration, isPublished } = req.body;

    const existing = await prisma.course.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Course not found' });
      return;
    }

    let thumbnail = req.body.thumbnail !== undefined ? req.body.thumbnail : existing.thumbnail;
    if (req.file) {
      thumbnail = `/uploads/thumbnails/${req.file.filename}`;
    }

    const updated = await prisma.course.update({
      where: { id },
      data: {
        title: title || existing.title,
        description: description || existing.description,
        category: category || existing.category,
        level: level || existing.level,
        duration: duration !== undefined ? duration : existing.duration,
        thumbnail,
        isPublished: isPublished !== undefined ? isPublished === 'true' || isPublished === true : existing.isPublished,
      },
    });

    res.status(200).json({ success: true, message: 'Course updated successfully', data: updated });
  } catch (error: any) {
    console.error('Update course error:', error);
    res.status(500).json({ success: false, message: 'Failed to update course' });
  }
};

export const deleteCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.course.delete({ where: { id } });
    res.status(200).json({ success: true, message: 'Course deleted successfully' });
  } catch (error: any) {
    console.error('Delete course error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete course' });
  }
};
