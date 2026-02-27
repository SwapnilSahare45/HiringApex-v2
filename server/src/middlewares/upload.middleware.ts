import { NextFunction, Request, Response } from 'express';
import multer, { FileFilterCallback } from 'multer';
import { processImage } from '../utils/processImage';

// Memory storage
const storage = multer.memoryStorage();

// File filters
const imageFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpg, jpeg, png, webp)'));
  }
};

const resumeFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const allowedMimes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, DOC, DOCX files are allowed'));
  }
};

// Multer instances

export const uploadAvatarMulter = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1014 }, // 5 MB before processing
});

export const uploadResumeMulter = multer({
  storage,
  fileFilter: resumeFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const uploadImageMulter = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Sharp processing middlware
export const processAvatar = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      next();
      return;
    }

    req.file.buffer = await processImage(req.file.buffer, {
      width: 400,
      height: 400,
      quality: 80,
      fit: 'cover',
    });

    req.file.mimetype = 'image/webp';
    req.file.originalname = req.file.originalname.replace(/\.[^.]+$/, '.webp');

    next();
  } catch (error) {
    next(error);
  }
};

export const processCompanyLogo = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      next();
      return;
    }

    req.file.buffer = await processImage(req.file.buffer, {
      width: 400,
      height: 400,
      quality: 85,
      fit: 'contain',
    });

    req.file.mimetype = 'image/webp';
    req.file.originalname = req.file.originalname.replace(/\.[^.]+$/, '.webp');

    next();
  } catch (error) {
    next(error);
  }
};

export const processCompanyCover = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      next();
      return;
    }

    req.file.buffer = await processImage(req.file.buffer, {
      width: 1200,
      height: 400,
      quality: 85,
      fit: 'cover',
    });

    req.file.mimetype = 'image/webp';
    req.file.originalname = req.file.originalname.replace(/\.[^.]+$/, '.webp');

    next();
  } catch (error) {
    next(error);
  }
};

// Multer error handler
export const handleUploadError = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ message: 'File size too large. Maximum size to 5MB' });
      return;
    }

    res.status(400).json({ message: err.message });
    return;
  }

  if (err instanceof Error) {
    res.status(400).json({ message: err.message });
    return;
  }

  next(err);
};
