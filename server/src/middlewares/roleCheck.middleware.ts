import { NextFunction, Response } from 'express';
import { AuthRequest } from '../types/user.types';

export const roleCheck = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;

    if (!userRole || !allowedRoles.includes(userRole)) {
      return res
        .status(403)
        .json({ message: 'Forbidden: You do not have permission to perform this action' });
    }

    next();
  };
};
