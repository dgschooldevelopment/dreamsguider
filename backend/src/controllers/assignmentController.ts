import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
import { createAndSendNotifications } from '../services/notificationService';

// Admin: Create assignment
export const createAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { courseId, topicId, title, description, dueDate, maxScore } = req.body;

    if (!courseId || !title || !description) {
      res.status(400).json({ success: false, message: 'courseId, title, and description are required.' });
      return;
    }

    const assignment = await prisma.assignment.create({
      data: {
        courseId,
        topicId: topicId || null,
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        maxScore: maxScore ? Number(maxScore) : 100,
      },
      include: {
        course: { select: { title: true } },
      },
    });

    res.status(201).json({ success: true, message: 'Assignment created successfully', data: assignment });
  } catch (error: any) {
    console.error('Create assignment error:', error);
    res.status(500).json({ success: false, message: 'Failed to create assignment' });
  }
};

// Admin: Get all assignments (or by course)
export const getAssignments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { courseId, topicId } = req.query;

    const whereClause: any = {};
    if (courseId) whereClause.courseId = String(courseId);
    if (topicId) whereClause.topicId = String(topicId);

    const assignments = await prisma.assignment.findMany({
      where: whereClause,
      include: {
        course: { select: { id: true, title: true } },
        topic: { select: { id: true, title: true } },
        _count: {
          select: { submissions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ success: true, data: assignments });
  } catch (error: any) {
    console.error('Get assignments error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch assignments' });
  }
};

// Student: Get assignments for a course with user submission state
export const getStudentAssignments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { courseId } = req.params;
    const userId = req.user.userId;

    const assignments = await prisma.assignment.findMany({
      where: { courseId },
      include: {
        topic: { select: { id: true, title: true } },
        submissions: {
          where: { userId },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = assignments.map((a) => {
      const mySubmission = a.submissions[0] || null;
      return {
        id: a.id,
        courseId: a.courseId,
        topicId: a.topicId,
        topicTitle: a.topic?.title || 'General Course Assignment',
        title: a.title,
        description: a.description,
        dueDate: a.dueDate,
        maxScore: a.maxScore,
        createdAt: a.createdAt,
        submission: mySubmission,
      };
    });

    res.status(200).json({ success: true, data: formatted });
  } catch (error: any) {
    console.error('Get student assignments error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch student assignments' });
  }
};

// Student: Submit assignment solution
export const submitAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { assignmentId } = req.params;
    const { submissionText } = req.body;
    const userId = req.user.userId;

    let fileUrl: string | null = null;
    if (req.file) {
      fileUrl = `/uploads/assignments/${req.file.filename}`;
    }

    if (!submissionText && !fileUrl) {
      res.status(400).json({ success: false, message: 'Please provide either written text or upload a file.' });
      return;
    }

    const submission = await prisma.assignmentSubmission.upsert({
      where: {
        assignmentId_userId: {
          assignmentId,
          userId,
        },
      },
      update: {
        submissionText: submissionText || undefined,
        fileUrl: fileUrl || undefined,
        status: 'PENDING',
        submittedAt: new Date(),
      },
      create: {
        assignmentId,
        userId,
        submissionText: submissionText || null,
        fileUrl: fileUrl || null,
        status: 'PENDING',
      },
    });

    res.status(200).json({
      success: true,
      message: 'Assignment submitted successfully!',
      data: submission,
    });
  } catch (error: any) {
    console.error('Submit assignment error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit assignment' });
  }
};

// Admin: Get all submissions for an assignment
export const getSubmissionsForAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { assignmentId } = req.params;

    const submissions = await prisma.assignmentSubmission.findMany({
      where: { assignmentId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        assignment: {
          select: {
            title: true,
            maxScore: true,
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    res.status(200).json({ success: true, data: submissions });
  } catch (error: any) {
    console.error('Get submissions error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch submissions' });
  }
};

// Admin: Grade assignment submission
export const gradeSubmission = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { submissionId } = req.params;
    const { score, feedback, status } = req.body;

    const existingSubmission = await prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: { select: { title: true, maxScore: true, courseId: true } },
        user: { select: { id: true, name: true } },
      },
    });

    if (!existingSubmission) {
      res.status(404).json({ success: false, message: 'Submission not found' });
      return;
    }

    const graded = await prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        score: score !== undefined ? Number(score) : existingSubmission.score,
        feedback: feedback !== undefined ? feedback : existingSubmission.feedback,
        status: status || 'GRADED',
        gradedAt: new Date(),
      },
    });

    // Notify student about graded assignment
    await createAndSendNotifications({
      userIds: [existingSubmission.userId],
      title: `Assignment Graded: ${existingSubmission.assignment.title}`,
      message: `Your assignment "${existingSubmission.assignment.title}" has been reviewed. Score: ${score}/${existingSubmission.assignment.maxScore}. Feedback: ${feedback || 'Well done!'}`,
      type: 'ASSIGNMENT_GRADED',
      link: `/learn/${existingSubmission.assignment.courseId}`,
    });

    res.status(200).json({
      success: true,
      message: 'Submission graded successfully',
      data: graded,
    });
  } catch (error: any) {
    console.error('Grade submission error:', error);
    res.status(500).json({ success: false, message: 'Failed to grade submission' });
  }
};
