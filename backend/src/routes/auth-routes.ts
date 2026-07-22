import { Router, type Router as RouterType } from "express";
import { rateLimit } from "../security/rate-limit";
import { authAccessRouter } from "./auth-access-routes";
import { authLoginRouter } from "./auth-login-routes";
import { authResetRouter } from "./auth-reset-routes";

export const authRouter: RouterType = Router();
authRouter.use(
  ["/login", "/request-access"],
  rateLimit("auth", 15 * 60_000, 20),
);
authRouter.use(
  ["/forgot-password", "/reset-password"],
  rateLimit("reset", 60 * 60_000, 10),
);
authRouter.use(authLoginRouter);
authRouter.use(authAccessRouter);
authRouter.use(authResetRouter);
