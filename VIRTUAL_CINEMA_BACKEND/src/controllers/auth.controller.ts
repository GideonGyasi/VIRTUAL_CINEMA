import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { AuthService } from '../services/auth.service';
import { asyncHandler, ApiResponse } from '../utils/errorHandler';
import logger from '../utils/logger';

export const verifyToken = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({
      success: false,
      error: 'Token is required',
    } as ApiResponse);
  }

  const payload: any = AuthService.verifyToken(token);
  const user = await AuthService.getUserById(payload.uid);

  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' } as ApiResponse);
  }

  logger.info(`User authenticated: ${user.id}`);

  const response: ApiResponse = {
    success: true,
    data: {
      user,
      token: payload,
    },
  };

  res.json(response);
});

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { username, email, password } = req.body;

  if (!email || !password || !username) {
    return res.status(400).json({ success: false, error: 'username, email and password are required' } as ApiResponse);
  }

  const { user, token } = await AuthService.register(username, email, password);

  const response: ApiResponse = {
    success: true,
    data: { user, token },
  };

  res.json(response);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'email and password are required' } as ApiResponse);
  }

  const { user, token } = await AuthService.login(email, password);

  const response: ApiResponse = {
    success: true,
    data: { user, token },
  };

  res.json(response);
});

export const getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.uid;

  if (!userId) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
    } as ApiResponse);
  }

  const user = await AuthService.getUserById(userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found',
    } as ApiResponse);
  }

  const response: ApiResponse = {
    success: true,
    data: { user },
  };

  res.json(response);
});
