import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { asyncHandler } from "../../utils/asyncHandler";
import { sendResponse } from "../../utils/apiResponse";
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
} from "./auth.validation";
import { AuthService } from "./auth.service";
import { ApiError } from "../../middleware/error.middleware";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const validated = registerSchema.parse({ body: req.body });
  const result = await AuthService.register(validated.body);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    message: "Registration successful",
    data: result,
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const validated = loginSchema.parse({ body: req.body });
  const result = await AuthService.login(validated.body);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: "Login successful",
    data: result,
  });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  // requireAuth middleware ইতিমধ্যে token validate করে req.token এ রেখেছে
  const accessToken = req.token;
  if (!accessToken) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "No token provided");
  }

  // Client optionally refresh token পাঠাতে পারে body তে
  const refreshToken = req.body?.refreshToken as string | undefined;

  const result = await AuthService.logout(accessToken, refreshToken);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: "Logout successful",
    data: result,
  });
});

export const refreshToken = asyncHandler(
  async (req: Request, res: Response) => {
    const validated = refreshTokenSchema.parse({ body: req.body });
    const tokens = await AuthService.refreshAccessToken(
      validated.body.refreshToken,
    );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      message: "Token refreshed successfully",
      data: tokens,
    });
  },
);

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized access");
  }
  const result = await AuthService.getMe(userId);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: "User profile fetched successfully",
    data: result,
  });
});

export const AuthController = {
  register,
  login,
  logout,
  refreshToken,
  getMe,
};
