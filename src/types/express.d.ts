import { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload & { userId?: string; role?: string };
      // requireAuth middleware থেকে raw token পাস হয়
      // যাতে logout controller আবার header parse না করে
      token?: string;
    }
  }
}
