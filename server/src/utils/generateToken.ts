import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || 'access-secret';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_SECRET || 'refresh-secret';
const ACCESS_TOKEN_EXPIRES = '15m';
const REFRESH_TOKEN_EXPIRES = '7d';

interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

export const generateAccessToken = (payload: JwtPayload) => {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES });
};

export const generateRefreshToken = (payload: JwtPayload) => {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES });
};

export const verifyAccessToken = (token: string) => {
  try {
    return jwt.verify(token, ACCESS_TOKEN_SECRET) as JwtPayload;
  } catch {
    return null;
  }
};

export const verifyRefreshToken = (token: string) => {
  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET) as JwtPayload;
  } catch {
    return null;
  }
};
