import jwt, { JwtPayload } from "jsonwebtoken";
import { env } from "../../config/env";
import { LoginInput, RegisterInput } from "./auth.validation";
import { User } from "./auth.model";
import { ApiError } from "../../middleware/error.middleware";
import { StatusCodes } from "http-status-codes";
import redisClient, { isRedisReady, memBlacklistAdd } from "../../config/redis";

interface TokenPayload {
  userId: string;
  role: string;
}

const generateTokens = (payload: TokenPayload) => {
  const accessToken = jwt.sign(payload, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn as jwt.SignOptions["expiresIn"],
  });

  const refreshToken = jwt.sign(payload, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn as jwt.SignOptions["expiresIn"],
  });

  return { accessToken, refreshToken };
};

export const register = async (data: RegisterInput) => {
  const existing = await User.findOne({ email: data.email });
  if (existing) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Email already registered");
  }

  const user = await User.create(data);
  const tokens = generateTokens({
    userId: user._id.toString(),
    role: user.role,
  });

  return {
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
    ...tokens,
  };
};

export const login = async (data: LoginInput) => {
  const user = await User.findOne({ email: data.email }).select("+password");

  if (!user || !(await user.comparePassword(data.password))) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid email or password");
  }

  if (!user.isActive) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Account is deactivated");
  }

  const tokens = generateTokens({
    userId: user._id.toString(),
    role: user.role,
  });

  return {
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
    ...tokens,
  };
};

export const logout = async (accessToken: string, refreshToken?: string) => {
  // ── Access token blacklist ────────────────────────────────────────────────
  const decodedAccess = jwt.decode(accessToken) as JwtPayload;

  if (decodedAccess?.exp) {
    const accessExpiresIn = decodedAccess.exp - Math.floor(Date.now() / 1000);
    if (accessExpiresIn > 0) {
      if (isRedisReady()) {
        await redisClient.set(`BL_${accessToken}`, "blacklisted", { EX: accessExpiresIn });
      } else {
        memBlacklistAdd(accessToken, accessExpiresIn);
      }
    }
  }

  // ── Refresh token blacklist ───────────────────────────────────────────────
  if (refreshToken) {
    try {
      const decodedRefresh = jwt.verify(refreshToken, env.jwt.refreshSecret) as JwtPayload;
      if (decodedRefresh?.exp) {
        const refreshExpiresIn = decodedRefresh.exp - Math.floor(Date.now() / 1000);
        if (refreshExpiresIn > 0) {
          if (isRedisReady()) {
            await redisClient.set(`BL_${refreshToken}`, "blacklisted", { EX: refreshExpiresIn });
          } else {
            memBlacklistAdd(refreshToken, refreshExpiresIn);
          }
        }
      }
    } catch {
    }
  }

  return { success: true, message: "Logged out successfully" };
};

export const refreshAccessToken = async (refreshToken: string) => {
  if (isRedisReady()) {
    const isBlacklisted = await redisClient.get(`BL_${refreshToken}`);
    if (isBlacklisted) {
      throw new ApiError(
        StatusCodes.UNAUTHORIZED,
        "Refresh token is revoked. Please login again.",
      );
    }
  }

  let decoded: JwtPayload;
  try {
    decoded = jwt.verify(refreshToken, env.jwt.refreshSecret) as JwtPayload;
  } catch {
    throw new ApiError(
      StatusCodes.UNAUTHORIZED,
      "Invalid or expired refresh token",
    );
  }

  const user = await User.findById(decoded.userId);
  if (!user || !user.isActive) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "User not found or inactive");
  }

  if (isRedisReady() && decoded.exp) {
    const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
    if (expiresIn > 0) {
      await redisClient.set(`BL_${refreshToken}`, "blacklisted", {
        EX: expiresIn,
      });
    }
  }

  const tokens = generateTokens({
    userId: user._id.toString(),
    role: user.role,
  });

  return tokens;
};

export const getMe = async (userId: string) => {
  const user = await User.findById(userId).select("-password");

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  if (!user.isActive) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Account is deactivated");
  }

  return user;
};

export const AuthService = {
  register,
  login,
  logout,
  refreshAccessToken,
  getMe,
};
