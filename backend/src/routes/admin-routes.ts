import { Router, type Router as RouterType } from "express";
import { adminActionRouter } from "./admin-action-routes";
import { adminQueryRouter } from "./admin-query-routes";

export const adminRouter: RouterType = Router();
adminRouter.use(adminQueryRouter);
adminRouter.use(adminActionRouter);
