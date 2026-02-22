import { NextFunction, Response } from 'express';
import { AuthRequest } from '../types/user.types';
import { verifyAccessToken } from '../utils/generateToken';

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);

    if (!decoded) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};
