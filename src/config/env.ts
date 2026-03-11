import dotenv from "dotenv";
dotenv.config({ path: ".env" });
const required = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env variable: ${key}`);
  return value;
};

const optional = (key: string, fallback: string): string =>
  process.env[key] ?? fallback;

export const env = {
  app: {
    name: optional("APP_NAME", "GenAiProject"),
    port: parseInt(optional("PORT", "5000"), 10),
    nodeEnv: optional("NODE_ENV", "development"),
    apiVersion: optional("API_VERSION", "v1"),
    isProduction: process.env.NODE_ENV === "production",
  },
  db: {
    uri: required("MONGO_URI"),
  },
  jwt: {
    secret: required("JWT_SECRET"),
    expiresIn: optional("JWT_EXPIRES_IN", "7d"),
    refreshSecret: required("JWT_REFRESH_SECRET"),
    refreshExpiresIn: optional("JWT_REFRESH_EXPIRES_IN", "30d"),
  },
  redis: {
    host: optional("REDIS_HOST", "localhost"),
    port: parseInt(optional("REDIS_PORT", "6379"), 10),
  },
  //   jwt: {
  //     secret: required("JWT_SECRET"),
  //     expiresIn: optional("JWT_EXPIRES_IN", "7d"),
  //     refreshSecret: required("JWT_REFRESH_SECRET"),
  //     refreshExpiresIn: optional("JWT_REFRESH_EXPIRES_IN", "30d"),
  //   },
  //   cors: {
  //     allowedOrigins: optional("ALLOWED_ORIGINS", "http://localhost:3000").split(","),
  //   },
  //   smtp: {
  //     host: optional("SMTP_HOST", "smtp.gmail.com"),
  //     port: parseInt(optional("SMTP_PORT", "587"), 10),
  //     user: optional("SMTP_USER", ""),
  //     pass: optional("SMTP_PASS", ""),
  //     from: optional("SMTP_FROM", "no-reply@app.com"),
  //   },
  //   cloudinary: {
  //     cloudName: optional("CLOUDINARY_CLOUD_NAME", ""),
  //     apiKey: optional("CLOUDINARY_API_KEY", ""),
  //     apiSecret: optional("CLOUDINARY_API_SECRET", ""),
  //   },
  //   rateLimit: {
  //     windowMs: parseInt(optional("RATE_LIMIT_WINDOW_MS", "900000"), 10),
  //     max: parseInt(optional("RATE_LIMIT_MAX", "100"), 10),
  //   },
  //   client: {
  //     url: optional("CLIENT_URL", "http://localhost:3000"),
  //   },
};
