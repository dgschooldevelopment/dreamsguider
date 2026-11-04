import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/prisma';
import { generateToken } from '../config/jwt';
import { AuthRequest } from '../middleware/auth';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only allow registration if explicitly configured or through admin
    const { name, email, password, phone, role } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
      return;
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      res.status(409).json({ success: false, message: 'An account with this email already exists.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const assignedRole = role === 'ADMIN' ? 'ADMIN' : 'STUDENT';

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        phone: phone || null,
        role: assignedRole,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        avatar: true,
        createdAt: true,
      },
    });

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role as 'ADMIN' | 'STUDENT',
      name: user.name,
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: {
        user,
        token,
      },
    });
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: error.message || 'Registration failed.' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, requiredRole } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required.' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    // If login requested from specific portal (e.g. Admin portal only allows ADMIN)
    if (requiredRole && user.role !== requiredRole) {
      res.status(403).json({
        success: false,
        message: requiredRole === 'ADMIN'
          ? 'Access denied. This portal is for instructors and admins only.'
          : 'Access denied.',
      });
      return;
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role as 'ADMIN' | 'STUDENT',
      name: user.name,
    });

    res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          avatar: user.avatar,
        },
        token,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed.' });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated.' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        avatar: true,
        createdAt: true,
        enrollments: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                slug: true,
                thumbnail: true,
                category: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    res.status(200).json({ success: true, data: user });
  } catch (error: any) {
    console.error('GetMe error:', error);
    res.status(500).json({ success: false, message: 'Could not fetch user profile.' });
  }
};

export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        avatar: true,
        createdAt: true,
        enrollments: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });

    res.status(200).json({ success: true, data: users });
  } catch (error: any) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users.' });
  }
};

// Admin adds student directly
export const createStudentByAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone, courseIds } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: 'Student name, email, and initial password are required.' });
      return;
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      res.status(409).json({ success: false, message: 'A user with this email address already exists.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const student = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        phone: phone?.trim() || null,
        role: 'STUDENT',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        createdAt: true,
      },
    });

    // Optionally allocate courses directly
    if (Array.isArray(courseIds) && courseIds.length > 0) {
      for (const courseId of courseIds) {
        await prisma.enrollment.create({
          data: {
            userId: student.id,
            courseId,
            status: 'ACTIVE',
          },
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `Student "${student.name}" created and enrolled successfully.`,
      data: student,
    });
  } catch (error: any) {
    console.error('Create student error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to add student.' });
  }
};

// Admin: Update student or user profile
export const updateStudentByAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { name, email, phone, password, role } = req.body;

    if (!userId) {
      res.status(400).json({ success: false, message: 'User ID is required.' });
      return;
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    const updateData: any = {};

    if (name && typeof name === 'string' && name.trim()) {
      updateData.name = name.trim();
    }

    if (email && typeof email === 'string' && email.trim()) {
      const cleanEmail = email.toLowerCase().trim();
      if (cleanEmail !== existingUser.email) {
        const emailExists = await prisma.user.findUnique({
          where: { email: cleanEmail },
        });
        if (emailExists) {
          res.status(409).json({ success: false, message: 'This email is already in use by another user.' });
          return;
        }
        updateData.email = cleanEmail;
      }
    }

    if (phone !== undefined) {
      updateData.phone = phone ? phone.trim() : null;
    }

    if (password && typeof password === 'string' && password.trim().length > 0) {
      updateData.password = await bcrypt.hash(password.trim(), 10);
    }

    if (role && (role === 'STUDENT' || role === 'ADMIN')) {
      if (req.user?.userId === userId && role !== 'ADMIN') {
        res.status(400).json({ success: false, message: 'You cannot remove your own administrator status.' });
        return;
      }
      updateData.role = role;
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
        enrollments: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: `Student "${updated.name}" updated successfully.`,
      data: updated,
    });
  } catch (error: any) {
    console.error('Update student error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update student.' });
  }
};

// Admin: Delete student or user
export const deleteStudentByAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({ success: false, message: 'User ID is required.' });
      return;
    }

    // Safety: Admin cannot delete themselves!
    if (req.user?.userId === userId) {
      res.status(400).json({ success: false, message: 'You cannot delete your own account.' });
      return;
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    // Delete user (cascade deletes enrollments, topicProgress, submissions, notifications, doubts)
    await prisma.user.delete({
      where: { id: userId },
    });

    res.status(200).json({
      success: true,
      message: `Student "${targetUser.name}" has been permanently deleted.`,
    });
  } catch (error: any) {
    console.error('Delete student error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to delete student.' });
  }
};
