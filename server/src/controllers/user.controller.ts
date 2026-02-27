import { Response } from 'express';
import { User } from '../models/User';
import { AuthRequest } from '../types/user.types';
import { deleteFromCloudinary, uploadToCloudinary } from '../utils/cloudinary';
import { updateProfileSchema } from '../validators/user.validator';

export const getMyProfile = async (req: AuthRequest, res: Response): Promise<void> => {
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

export const updateMyProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    const result = updateProfileSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        message: 'Validation failed',
        errors: result.error.issues.map((err) => ({
          field: err.path[0],
          message: err.message,
        })),
      });
      return;
    }

    const { firstName, lastName, phone } = result.data;

    const updateData: Partial<{ firstName: string; lastName: string; phone: string }> = {};
    if (firstName !== undefined) updateData.firstName = firstName.trim();
    if (lastName !== undefined) updateData.lastName = lastName.trim();
    if (phone !== undefined) updateData.phone = phone.trim();

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    }).select('-password');

    res.status(200).json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const updateAvatar = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }

    const userId = req.user?.id;

    const user = await User.findById(userId).select('-password');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // delete old avatar from cloudinary
    if (user.avatar?.publicId) {
      await deleteFromCloudinary(user.avatar.publicId, 'image');
    }

    const result = await uploadToCloudinary(req.file.buffer, {
      folder: 'hiring_apex/avatars',
      publicId: `avatar_${userId}`,
      resourceType: 'image',
    });

    await User.findByIdAndUpdate(userId, {
      $set: {
        avatar: {
          url: result.secure_url,
          publicId: result.public_id,
        },
      },
    });

    res
      .status(200)
      .json({ message: 'Avatar uploaded successfully', avatar: { url: result.secure_url } });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const deleteAvatar = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    const user = await User.findById(userId).select('-password');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (!user.avatar?.publicId) {
      res.status(400).json({ message: 'No avatar to delete' });
      return;
    }

    await deleteFromCloudinary(user.avatar.publicId, 'image');

    await User.findByIdAndUpdate(userId, {
      $set: { avatar: { url: '', publicId: '' } },
    });

    res.status(200).json({ message: 'Avatar deleted successfully' });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const deleteMyAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // TODO: Delete related data (jobs, application, etc.)

    await User.findByIdAndDelete(userId);

    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};
