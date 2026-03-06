import { Response } from "express";

interface ResponseOptions {
  statusCode: number;
  message: string;
  data?: unknown;
}

export const sendResponse = (res: Response, options: ResponseOptions): void => {
  res.status(options.statusCode).json({
    success: true,
    message: options.message,
    data: options.data ?? null,
  });
};