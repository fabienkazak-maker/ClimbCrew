import type { RequestAuth } from "./domain";

declare global {
  namespace Express {
    interface Request {
      auth?: RequestAuth;
    }
  }
}
