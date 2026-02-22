import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Request, Response } from 'express';
import { SeekerProfile } from '../models/Seeker';
import { User } from '../models/User';
import { AuthRequest, TokenParams } from '../types/user.types';
import { generateOTP } from '../utils/generateOTP';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/generateToken';
import { sendEmail } from '../utils/sendEmail';
import { loginSchema, registerSchema } from '../validators/auth.validator';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = registerSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        message: 'validation failed',
        errors: result.error.issues.map((err) => ({
          field: err.path[0],
          message: err.message,
        })),
      });
      return;
    }

    const { firstName, lastName, email, password, role, phone } = result.data;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    const otp = generateOTP();
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

    const otpVerificationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(otpVerificationToken).digest('hex');
    const otpVerificationTokenExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 min

    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role,
      phone,
      isApproved: role === 'recruiter' ? false : true,
      isEmailVerified: false,
      otp: hashedOtp,
      otpExpires: new Date(Date.now() + 5 * 60 * 1000), // 5 Min
      otpVerificationToken: hashedToken,
      otpVerificationTokenExpires,
    });

    // TODO: Auto-create profile based on role
    if (role === 'seeker') {
      await SeekerProfile.create({ user: user._id });
    }
    // else if (role === 'recruiter') {
    //   await RecruiterProfile.create({ user: user._id });
    // }

    await sendEmail(
      email,
      'Email Verification OTP',
      `
       <h1>Verify Your Email</h1>
       <p>Your OTP is:</p>
       <h1>${otp}</h1>
       <p>This OTP is valid for 5 minutes.</p>
       `
    );

    res.status(201).json({
      message: 'User registered. OTP sent to email.',
      otpVerificationToken,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const verifyOTP = async (req: Request<TokenParams>, res: Response): Promise<void> => {
  try {
    const token = req.params.token;
    const { otp } = req.body;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

    const user = await User.findOne({
      otp: hashedOtp,
      otpExpires: { $gt: Date.now() },
      otpVerificationToken: hashedToken,
      otpVerificationTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      res.status(400).json({ message: 'Invalid or expired OTP' });
      return;
    }

    user.isEmailVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    user.otpVerificationToken = undefined;
    user.otpVerificationTokenExpires = undefined;

    await user.save();

    res.status(200).json({ message: 'Email verified successfully' });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = loginSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        message: 'Invalid input',
        errors: result.error.issues.map((err) => ({
          field: err.path[0],
          message: err.message,
        })),
      });
      return;
    }

    const { email, password } = result.data;

    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    if (user && !user.isEmailVerified) {
      res.status(403).json({ message: 'Your email is not verified. Please verify before login.' });
      return;
    }

    if (user.role === 'recruiter' && !user.isApproved) {
      res.status(400).json({ message: 'Your recruiter profile is not approved yet.' });
      return;
    }

    const payload = { id: user._id.toString(), email: user.email, role: user.role };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      message: 'Login successful',
      accessToken,
      user: {
        fullName: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
        isVerified: user.isEmailVerified,
        isApproved: user.isApproved,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    res.cookie('refreshToken', '', {
      httpOnly: true,
      expires: new Date(0),
    });

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');

    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.passwordResetExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 min

    await user.save();

    const resetURL = `http://localhost:3000/reset-password/${resetToken}`;

    await sendEmail(
      user.email,
      'Password Reset',
      `
      <h2>Password Reset Request</h2>
      <p>Click the link below to reset your password:</p>
      <a href="${resetURL}">${resetURL}</a>
      <p>This link is valid for 5 minutes.</p>
      `
    );

    res.status(200).json({ message: 'Reset link sent to email' });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const resetPassword = async (req: Request<TokenParams>, res: Response): Promise<void> => {
  try {
    const token = req.params.token;
    const { password } = req.body;

    if (!token || typeof token !== 'string') {
      res.status(400).json({ message: 'Invalid token' });
      return;
    }
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      res.cookie('refreshToken', '', {
        httpOnly: true,
        expires: new Date(0),
      });
      res.status(401).json({ message: 'No refresh token found' });
      return;
    }

    const decoded = verifyRefreshToken(token);
    if (!decoded) {
      res.cookie('refreshToken', '', {
        httpOnly: true,
        expires: new Date(0),
      });
      res.status(403).json({ message: 'Invalid or expired refresh token' });
      return;
    }

    const user = await User.findById(decoded?.id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const newAccessToken = generateAccessToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    const newRefreshToken = generateRefreshToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      message: 'Access token refreshed',
      accessToken: newAccessToken,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    const user = await User.findById(userId).select('-password');

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.status(200).json({ user });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};
