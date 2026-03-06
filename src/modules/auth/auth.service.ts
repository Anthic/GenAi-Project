import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { LoginInput, RegisterInput } from "./auth.validation";
import { User } from "./auth.model";
import { ApiError } from "../../middleware/error.middleware";
import { StatusCodes } from "http-status-codes";
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
  const token = generateTokens({
    userId: user._id.toJSON(),
    role: user.role,
  });
  return {
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
    ...token,
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

export const logout = async () => {
  return {
    success: true,
    message: "Logged out successfully",
  };
};

export const AuthService = {
  register,
  login,
  logout,
};
