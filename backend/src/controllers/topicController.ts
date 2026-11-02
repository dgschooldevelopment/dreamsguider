import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
import { notifyCourseEnrolledStudents } from '../services/notificationService';

// --- MODULE / CHAPTER MANAGEMENT ---

export const createModule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { courseId, title, description, order } = req.body;

    if (!courseId || !title) {
      res.status(400).json({ success: false, message: 'courseId and title are required.' });
      return;
    }

    const maxOrderMod = await prisma.module.findFirst({
      where: { courseId },
      orderBy: { order: 'desc' },
    });

    const newOrder = order !== undefined ? Number(order) : (maxOrderMod ? maxOrderMod.order + 1 : 0);

    const module = await prisma.module.create({
      data: {
        courseId,
        title,
        description: description || null,
        order: newOrder,
      },
      include: {
        topics: true,
      },
    });

    res.status(201).json({ success: true, message: 'Module added to syllabus', data: module });
  } catch (error: any) {
    console.error('Create module error:', error);
    res.status(500).json({ success: false, message: 'Failed to create module' });
  }
};

export const updateModule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, order } = req.body;

    const updated = await prisma.module.update({
      where: { id },
      data: {
        title: title || undefined,
        description: description !== undefined ? description : undefined,
        order: order !== undefined ? Number(order) : undefined,
      },
    });

    res.status(200).json({ success: true, message: 'Module updated successfully', data: updated });
  } catch (error: any) {
    console.error('Update module error:', error);
    res.status(500).json({ success: false, message: 'Failed to update module' });
  }
};

export const deleteModule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.module.delete({ where: { id } });
    res.status(200).json({ success: true, message: 'Module deleted successfully' });
  } catch (error: any) {
    console.error('Delete module error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete module' });
  }
};

// --- TOPIC & VIDEO MANAGEMENT ---

export const createTopic = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { moduleId, title, description, videoUrl, videoType, duration, order, notes } = req.body;

    if (!moduleId || !title) {
      res.status(400).json({ success: false, message: 'moduleId and title are required.' });
      return;
    }

    const moduleRecord = await prisma.module.findUnique({
      where: { id: moduleId },
      include: { course: true },
    });

    if (!moduleRecord) {
      res.status(404).json({ success: false, message: 'Module not found.' });
      return;
    }

    // Determine videoUrl: either from uploaded file or from body
    let finalVideoUrl = videoUrl || '';
    let finalVideoType = videoType || 'url';

    if (req.file) {
      finalVideoUrl = `/uploads/videos/${req.file.filename}`;
      finalVideoType = 'local';
    }

    const maxOrderTopic = await prisma.topic.findFirst({
      where: { moduleId },
      orderBy: { order: 'desc' },
    });

    const newOrder = order !== undefined ? Number(order) : (maxOrderTopic ? maxOrderTopic.order + 1 : 0);

    const topic = await prisma.topic.create({
      data: {
        moduleId,
        title,
        description: description || null,
        videoUrl: finalVideoUrl || null,
        videoType: finalVideoType,
        duration: duration ? Number(duration) : 0,
        order: newOrder,
        notes: notes || null,
      },
    });

    // Requirement: When admin uploads a new topic/video, send notification to all enrolled users!
    if (finalVideoUrl) {
      await notifyCourseEnrolledStudents(
        moduleRecord.courseId,
        `New Video Added: ${title}`,
        `A new lesson "${title}" has been uploaded in course "${moduleRecord.course.title}". Watch it now!`,
        'NEW_VIDEO',
        `/learn/${moduleRecord.course.slug}?topicId=${topic.id}`
      );
    }

    res.status(201).json({
      success: true,
      message: 'Topic created and video uploaded successfully!',
      data: topic,
    });
  } catch (error: any) {
    console.error('Create topic error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to create topic' });
  }
};

export const updateTopic = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, videoUrl, videoType, duration, order, notes } = req.body;

    const existing = await prisma.topic.findUnique({
      where: { id },
      include: {
        module: {
          include: { course: true },
        },
      },
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'Topic not found' });
      return;
    }

    let finalVideoUrl = req.body.videoUrl !== undefined ? req.body.videoUrl : existing.videoUrl;
    let finalVideoType = videoType || existing.videoType;

    if (req.file) {
      finalVideoUrl = `/uploads/videos/${req.file.filename}`;
      finalVideoType = 'local';
    }

    const hadNoVideoBefore = !existing.videoUrl;

    const updated = await prisma.topic.update({
      where: { id },
      data: {
        title: title || existing.title,
        description: description !== undefined ? description : existing.description,
        videoUrl: finalVideoUrl,
        videoType: finalVideoType,
        duration: duration !== undefined ? Number(duration) : existing.duration,
        order: order !== undefined ? Number(order) : existing.order,
        notes: notes !== undefined ? notes : existing.notes,
      },
    });

    // If a video was newly added to an existing topic, trigger notification
    if (hadNoVideoBefore && finalVideoUrl) {
      await notifyCourseEnrolledStudents(
        existing.module.courseId,
        `New Video Available: ${updated.title}`,
        `A new video has been added to "${updated.title}" in course "${existing.module.course.title}".`,
        'NEW_VIDEO',
        `/learn/${existing.module.course.slug}?topicId=${updated.id}`
      );
    }

    res.status(200).json({ success: true, message: 'Topic updated successfully', data: updated });
  } catch (error: any) {
    console.error('Update topic error:', error);
    res.status(500).json({ success: false, message: 'Failed to update topic' });
  }
};

export const deleteTopic = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.topic.delete({ where: { id } });
    res.status(200).json({ success: true, message: 'Topic deleted successfully' });
  } catch (error: any) {
    console.error('Delete topic error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete topic' });
  }
};

// --- PROGRESS TRACKING FOR STUDENTS ---

export const updateTopicProgress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { topicId } = req.params;
    const { isCompleted, lastWatchedSec } = req.body;

    const userId = req.user.userId;

    const progress = await prisma.topicProgress.upsert({
      where: {
        userId_topicId: {
          userId,
          topicId,
        },
      },
      update: {
        isCompleted: isCompleted !== undefined ? isCompleted : undefined,
        lastWatchedSec: lastWatchedSec !== undefined ? Number(lastWatchedSec) : undefined,
        completedAt: isCompleted ? new Date() : undefined,
      },
      create: {
        userId,
        topicId,
        isCompleted: isCompleted || false,
        lastWatchedSec: lastWatchedSec ? Number(lastWatchedSec) : 0,
        completedAt: isCompleted ? new Date() : null,
      },
    });

    res.status(200).json({ success: true, message: 'Progress saved', data: progress });
  } catch (error: any) {
    console.error('Update progress error:', error);
    res.status(500).json({ success: false, message: 'Failed to update progress' });
  }
};
