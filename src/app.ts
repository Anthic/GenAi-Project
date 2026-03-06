import express, { Application, Request, Response, NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import { notFoundHandler } from "./middleware/notFoundHandler";
import { erroHandler } from "./middleware/error.middleware";
import { StatusCodes } from "http-status-codes";
import router from "./router";
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
    this.app.use(cors());
    this.app.disable("x-powered-by");
  }

  private setGeneralMiddleware(): void {
    this.app.use(express.json({ limit: "15mb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "15mb" }));
    if (process.env.NODE_ENV !== "production") {
      this.app.use(morgan("dev"));
    } else {
      this.app.use(morgan("combined"));
    }
  }
  private setRoutes(): void {
    //helmet check - load balancer /k8s probe
    this.app.get("/health", (_req: Request, res: Response) => {
      res.status(StatusCodes.OK).json({
        status: "ok",
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
      });
    });
    this.app.get("/", (req: Request, res: Response) => {
      res.status(StatusCodes.OK).json({
        success: true,
        message: "Welcome to genAiProject API",
        version: process.env.API_VERSION ?? "v1",
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
      });
    });

    //all routes start here
    this.app.use(`/api/${process.env.API_VERSION ?? "v1"}`, router);
  }

  private setErrorHandlers(): void {
    this.app.use(notFoundHandler);
    this.app.use(erroHandler);
  }
}

export default new App().app;
