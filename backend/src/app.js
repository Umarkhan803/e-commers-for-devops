import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import morgan from "morgan";

import { env } from "./config/env.js";
import routes from "./routes/index.js";
import { rateLimit } from "./middleware/rateLimit.js";
import { notFoundHandler, errorHandler } from "./middleware/error.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();

  // Nginx terminates the connection, so trust its forwarded headers for req.ip.
  app.set("trust proxy", 1);
  app.disable("x-powered-by");

  app.use(
    helmet({
      // Product images are served to a different origin in development.
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy: false,
    }),
  );

  app.use(
    cors({
      origin: true,
      credentials: true,
      exposedHeaders: ["X-Cache", "X-RateLimit-Remaining", "X-RateLimit-Limit"],
    }),
  );

  app.use(compression());
  app.use(express.json({ limit: "100kb" }));
  app.use(express.urlencoded({ extended: true, limit: "100kb" }));
  app.use(cookieParser());

  app.use(morgan(env.isProduction ? "combined" : "dev"));

  // Guest carts are keyed by a client-generated session id.
  app.use((req, _res, next) => {
    req.sessionId = req.get("X-Session-Id") ?? null;
    next();
  });

  app.use(
    "/images",
    express.static(path.join(HERE, "../public/images"), {
      maxAge: env.isProduction ? "30d" : 0,
      immutable: env.isProduction,
      fallthrough: true,
    }),
  );

  app.use(env.apiPrefix, rateLimit(), routes);

  // Convenience alias so /api/... works without the version segment.
  if (env.apiPrefix !== "/api") app.use("/api", rateLimit(), routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
