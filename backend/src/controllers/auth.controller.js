import * as authService from '../services/auth.service.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const data = await authService.registerUser({ name, email, password });
  sendSuccess(res, { statusCode: 201, message: 'Registration successful', data });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const data = await authService.loginUser({ email, password });
  sendSuccess(res, { message: 'Login successful', data });
});

export const me = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: { user: req.user.toJSON() } });
});
