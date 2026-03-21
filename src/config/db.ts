import mongoose from "mongoose";
import { env } from "./env";

const MAX_RETRIES = 5;
const RETRY_INTERVAL_MS = 5000;

class Database {
  private retryCount = 0;

  async connect(): Promise<void> {
    const uri = env.db.uri;

    if (!uri) {
      throw new Error("MONGO_URI is not defined in environment variables");
    }

    mongoose.connection.on("connected", () => {
    });

    mongoose.connection.on("error", (err) => {
      console.error(`[DB] MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("[DB] MongoDB disconnected. Attempting to reconnect...");
      this.reconnect();
    });

    await this.attemptConnection(uri);
  }

  private async attemptConnection(uri: string): Promise<void> {
    try {
      await mongoose.connect(uri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      this.retryCount = 0;
    } catch (err) {
      console.error(`[DB] Connection attempt ${this.retryCount + 1} failed`);
      this.reconnect();
    }
  }

  private reconnect(): void {
    if (this.retryCount >= MAX_RETRIES) {
      console.error("[DB] Max retries reached. Exiting process.");
      process.exit(1);
    }

    this.retryCount++;
    setTimeout(() => {
      const uri = process.env.MONGO_URI!;
      this.attemptConnection(uri);
    }, RETRY_INTERVAL_MS);
  }

  async disconnect(): Promise<void> {
    await mongoose.connection.close();
  }
}

export const database = new Database();
