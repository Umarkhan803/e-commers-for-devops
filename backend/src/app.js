import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import client from "prom-client";
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

  client.collectDefaultMetrics();

  app.get("/metrics", async (req, res) => {
    res.set("Content-Type", client.register.contentType);
    res.end(await client.register.metrics());
  });
  const httpRequestsTotal = new client.Counter({
    name: "http_requests_total",
    help: "Total number of HTTP requests",
    labelNames: ["method", "route", "status_code"],
  });

  const httpRequestDuration = new client.Histogram({
    name: "http_request_duration_seconds",
    help: "HTTP request duration in seconds",
    labelNames: ["method", "route", "status_code"],
    buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5],
  });
  app.use(env.apiPrefix, rateLimit(), routes);
  app.use((req, res, next) => {
    const start = process.hrtime.bigint();

    res.on("finish", () => {
      const duration = Number(process.hrtime.bigint() - start) / 1_000_000_000;

      const route = req.route?.path || req.path;

      const labels = {
        method: req.method,
        route,
        status_code: String(res.statusCode),
      };

      httpRequestsTotal.inc(labels);
      httpRequestDuration.observe(labels, duration);
    });

    next();
  });
  app.use(morgan(env.isProduction ? "combined" : "dev"));

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

  // Prometheus HTTP metrics
  app.use((req, res, next) => {
    const start = process.hrtime.bigint();

    res.on("finish", () => {
      const duration = Number(process.hrtime.bigint() - start) / 1_000_000_000;

      const route = req.route?.path || req.path;

      const labels = {
        method: req.method,
        route,
        status_code: String(res.statusCode),
      };

      httpRequestsTotal.inc(labels);
      httpRequestDuration.observe(labels, duration);
    });

    next();
  });

  app.use(env.apiPrefix, rateLimit(), routes);

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
