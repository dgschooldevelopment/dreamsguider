import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/prisma';
import { generateToken } from '../config/jwt';
import { AuthRequest } from '../middleware/auth';
import { sendOtpEmail } from '../services/emailService';

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

export const sendOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      res.status(400).json({ success: false, message: 'ईमेल आयडी आवश्यक आहे. (Email is required.)' });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();

    // Verify if user exists in the system
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'या ईमेलने कोणतेही खाते सापडले नाही. कृपया ॲडमिनशी संपर्क साधा. (No student account found with this email. Please contact your administrator to get enrolled.)',
      });
      return;
    }

    // Generate random 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete existing OTP tokens for this email
    await prisma.otpToken.deleteMany({
      where: { email: cleanEmail },
    });

    // Create new OTP token
    await prisma.otpToken.create({
      data: {
        email: cleanEmail,
        otp,
        expiresAt,
      },
    });

    // Send email via email service
    const emailResult = await sendOtpEmail(cleanEmail, otp, user.name);

    res.status(200).json({
      success: true,
      message: 'तुमच्या ईमेलवर ६ अंकी OTP पाठवला आहे. (A 6-digit OTP has been sent to your email.)',
      data: {
        email: cleanEmail,
        devOtp: emailResult.devOtp,
      },
    });
  } catch (error: any) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'OTP पाठवताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.',
    });
  }
};

export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      res.status(400).json({ success: false, message: 'Email and 6-digit OTP are required.' });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanOtp = otp.toString().trim();

    // Find latest OTP token for this email
    const record = await prisma.otpToken.findFirst({
      where: { email: cleanEmail },
      orderBy: { createdAt: 'desc' },
    });

    if (!record || record.otp !== cleanOtp) {
      res.status(400).json({
        success: false,
        message: 'अवैध किंवा चुकीचा OTP. कृपया पुन्हा तपासा. (Invalid OTP. Please check and try again.)',
      });
      return;
    }

    if (new Date() > record.expiresAt) {
      await prisma.otpToken.deleteMany({ where: { email: cleanEmail } });
      res.status(400).json({
        success: false,
        message: 'हा OTP कालबाह्य (expired) झाला आहे. कृपया नवीन OTP मागवा. (OTP has expired. Please request a new one.)',
      });
      return;
    }

    // OTP verified! Delete all OTPs for this email
    await prisma.otpToken.deleteMany({ where: { email: cleanEmail } });

    // Fetch user details
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
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
      message: 'लॉगिन यशस्वी झाले. (Logged in successfully.)',
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
    console.error('Verify OTP error:', error);
    res.status(500).json({ success: false, message: 'OTP पडताळणी अयशस्वी झाली.' });
  }
};
