import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { asyncHandler } from "../../utils/asyncHandler";
import { sendResponse } from "../../utils/apiResponse";
import { registerSchema, loginSchema } from "./auth.validation";
import { AuthService } from "./auth.service";

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
  const result = await AuthService.logout();

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: "Logout successful",
    data: result,
  });
});
export const AuthController = {
  register,
  login,
  logout,
};
