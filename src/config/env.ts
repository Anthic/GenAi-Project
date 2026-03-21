import dotenv from "dotenv";

dotenv.config({ path: ".env" });

if (typeof process === "undefined") {
  throw new Error(" process is not available (not running in Node)");
}

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
    isProduction: optional("NODE_ENV", "development") === "production",
    clientUrl: optional("CLIENT_URL", "http://localhost:3000"),
    apiVersion: optional("API_VERSION", "v1"),
  },
  db: {
    uri: required("MONGO_URI"),
  },
  jwt: {
    secret: required("JWT_SECRET"),
    refreshSecret: required("JWT_REFRESH_SECRET"),
    expiresIn: optional("JWT_EXPIRES_IN", "7d"),
    refreshExpiresIn: optional("JWT_REFRESH_EXPIRES_IN", "30d"),
  },
  redis: {
    host: optional("REDIS_HOST", "localhost"),
    port: parseInt(optional("REDIS_PORT", "6379"), 10),
  },
  api: {
    groqKey: required("GROQ_API_KEY"),
  },
};