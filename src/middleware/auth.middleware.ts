import { NextFunction, Request, Response } from "express";
import { ApiError } from "./error.middleware";
import { StatusCodes } from "http-status-codes";
import redisClient, { memBlacklistHas } from "../config/redis";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized access");
    }

    const token = authHeader.split(" ")[1];

    // Blacklist check: Redis থাকলে Redis, না থাকলে in-memory fallback
    if (redisClient.isReady) {
      const isBlacklisted = await redisClient.get(`BL_${token}`);
      if (isBlacklisted) {
        throw new ApiError(
          StatusCodes.UNAUTHORIZED,
          "Token is revoked. Please login again.",
        );
      }
    } else if (memBlacklistHas(token)) {
      throw new ApiError(
        StatusCodes.UNAUTHORIZED,
        "Token is revoked. Please login again.",
      );
    }

    const decoded = jwt.verify(token, env.jwt.secret);
    req.user = decoded as jwt.JwtPayload;

    // Raw token middleware থেকে pass করো — logout controller এ দরকার
    req.token = token;

    next();
  } catch (error) {
    // JWT specific errors — 401
    if (
      error instanceof jwt.JsonWebTokenError ||
      error instanceof jwt.TokenExpiredError ||
      error instanceof jwt.NotBeforeError
    ) {
      return next(
        new ApiError(StatusCodes.UNAUTHORIZED, "Invalid or expired token"),
      );
    }

    // ApiError (blacklist check, missing header) — as-is pass করো
    if (error instanceof ApiError) {
      return next(error);
    }

    // Unexpected error
    return next(
      new ApiError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Authentication service error",
      ),
    );
  }
};
