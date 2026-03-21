import express, { Application, Request, Response } from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import { notFoundHandler } from "./middleware/notFoundHandler";
import { erroHandler } from "./middleware/error.middleware";
import { StatusCodes } from "http-status-codes";
import router from "./router";
import { env } from "./config/env";

class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.setSecurityMiddleware();
    this.setGeneralMiddleware();
    this.setRoutes();
    this.setErrorHandlers();
  }

  private setSecurityMiddleware(): void {
    this.app.use(helmet());
    this.app.use(
      cors({
        origin: (origin, callback) => {
          if (!origin) return callback(null, true); 

          const allowedOrigins = [env.app.clientUrl, "http://localhost:3000"];
          if (!env.app.isProduction || allowedOrigins.includes(origin)) {
            return callback(null, true);
          } else {
            return callback(new Error(" CORS blocked"));
          }
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
      })
    );
    this.app.disable("x-powered-by");
  }

  private setGeneralMiddleware(): void {
    this.app.use(express.json({ limit: "15mb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "15mb" }));

    this.app.use(
      env.app.nodeEnv !== "production" ? morgan("dev") : morgan("combined")
    );
  }

  private setRoutes(): void {
    this.app.get("/health", (_req: Request, res: Response) => {
      res.status(StatusCodes.OK).json({
        status: "ok",
        environment: env.app.nodeEnv,
        timestamp: new Date().toISOString(),
      });
    });

    this.app.get("/", (_req: Request, res: Response) => {
      res.status(StatusCodes.OK).json({
        success: true,
        message: "Welcome to GenAiProject API",
        version: env.app.apiVersion ?? "v1",
        environment: env.app.nodeEnv,
        timestamp: new Date().toISOString(),
      });
    });

    this.app.use(`/api/${env.app.apiVersion ?? "v1"}`, router);
  }

  private setErrorHandlers(): void {
    this.app.use(notFoundHandler);
    this.app.use(erroHandler);
  }
}

export default new App().app;