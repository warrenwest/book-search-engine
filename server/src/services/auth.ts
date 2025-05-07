import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 🔧 Needed because __dirname is not available in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Adjust this to go to the root of your server project
const envPath = path.resolve(__dirname, '../../.env'); // or '../.env' depending on your build structure

dotenv.config({ path: envPath });


import type { Request, Response, NextFunction } from 'express';

// Extend the Request interface to include the 'user' property
declare global {
  namespace Express {
    interface Request {
      user: JwtPayload;
    }
  }
}

import { GraphQLError } from 'graphql';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  _id: unknown;
  username: string;
  email: string; // Added email property
}


export const authMiddleware = (req: { headers: { authorization?: string }; user: { _id: any; email: any; username: any } }, _res: any, next: any) => {
  let token = req.headers.authorization || ''; 

  if (token.startsWith('Bearer ')) {
    token = token.split(' ').pop()?.trim() || '';
  }

  if (!token) {
    return next();
  }

  try {
    const secret = process.env.JWT_SECRET_KEY || '';
    const decoded = jwt.verify(token, secret) as JwtPayload;
    const { _id, email, username } = decoded;
    req.user = { _id, email, username };
  } catch (err) {
    console.error('Invalid token', err);
  }

  return next();
};

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];

    const secretKey = process.env.JWT_SECRET_KEY || '';

    jwt.verify(token, secretKey, (err, user) => {
      if (err) {
        return res.sendStatus(403); // Forbidden
      }

      req.user = user as JwtPayload;
      return next();
    });
  } else {
    res.sendStatus(401); // Unauthorized
  }
};

export const signToken = (username: string, email: string, _id: unknown) => {
  return jwt.sign({ username, email, _id }, process.env.JWT_SECRET_KEY!, { expiresIn: '1h' });
};

export class AuthenticationError extends GraphQLError {
  constructor(message: string) {
    super(message, undefined, undefined, undefined, ['UNAUTHENTICATED']);
    Object.defineProperty(this, 'name', { value: 'AuthenticationError' });
  }
};

