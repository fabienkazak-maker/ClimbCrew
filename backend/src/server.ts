import cors from "cors";
import express from "express";
import { config } from "./config";
import { ensureBootstrapAdmin, ensureSchema } from "./database";
import { errorHandler } from "./http";
import { achievementRouter } from "./routes/achievement-routes";
import { adminRouter } from "./routes/admin-routes";
import { authRouter } from "./routes/auth-routes";
import { climbingRouteRouter } from "./routes/climbing-route-routes";
import { exportRouter, setupImportRouter } from "./routes/data-transfer-routes";
import { importRouter } from "./routes/import-routes";
import { participantRouter } from "./routes/participant-routes";
import { ropeRouter } from "./routes/rope-routes";
import { sessionRouter } from "./routes/session-routes";
import { systemRouter } from "./routes/system-routes";
import { normalizeApiPath, securityHeaders } from "./security/http-security";
import { rateLimit } from "./security/rate-limit";

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", config.trustProxy);
app.use(securityHeaders);
app.use(normalizeApiPath);
app.use(
  cors({
    credentials: true,
    origin(origin, callback) {
      if (!origin || config.corsOrigins.includes(origin.replace(/\/$/, ""))) {
        callback(null, true);
        return;
      }
      callback(new Error("Origine CORS non autorisée"));
    },
  }),
);
app.use(express.json({ limit: config.maxJsonBodySize }));
app.use((request, response, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    next();
    return;
  }
  rateLimit("write", 60_000, config.writeLimitPerMinute)(
    request,
    response,
    next,
  );
});
app.use(systemRouter);
app.use("/auth", authRouter);
app.use("/admin/auth", adminRouter);
app.use("/participants", participantRouter);
app.use("/sessions", sessionRouter);
app.use("/realisations", achievementRouter);
app.use("/ropes", ropeRouter);
app.use("/routes", climbingRouteRouter);
app.use("/admin/import-data", importRouter);
app.use("/admin/export-data", exportRouter);
app.use("/setup/import-data", setupImportRouter);
app.use("/import-data", importRouter);
app.use(errorHandler);

async function start(): Promise<void> {
  await ensureSchema();
  await ensureBootstrapAdmin();
  app.listen(config.port, () => {
    console.log(`ClimbCrew API listening on port ${config.port}`);
  });
}

start().catch((error: Error) => {
  console.error(error.message);
  process.exit(1);
});
