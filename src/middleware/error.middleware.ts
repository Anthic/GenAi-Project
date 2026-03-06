import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public isOperational = true,
  ) {
    super(message);
  }
}

export const erroHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const statusCode = err.statusCode ?? StatusCodes.INTERNAL_SERVER_ERROR;

  const isProduction = process.env.NODE_ENV === "production";
  console.error(`[Error] ${statusCode} - ${err.message}`);

  res.status(statusCode).json({
    success: false,
    message: err.isOperational ? err.message : "Internal Server Error",
    ...(isProduction ? {} : { stack: err.stack }),
  });
};
