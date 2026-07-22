import type { RequestHandler } from "express";

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export function rateLimit(
  prefix: string,
  windowMs: number,
  maximum: number,
): RequestHandler {
  return (request, response, next) => {
    const now = Date.now();
    const key = `${prefix}:${request.ip ?? "unknown"}`;
    const current = buckets.get(key);
    const bucket =
      !current || current.resetAt <= now
        ? { count: 0, resetAt: now + windowMs }
        : current;
    bucket.count += 1;
    buckets.set(key, bucket);
    response.setHeader("RateLimit-Limit", String(maximum));
    response.setHeader(
      "RateLimit-Reset",
      String(Math.ceil((bucket.resetAt - now) / 1000)),
    );
    if (bucket.count > maximum) {
      response.status(429).json({ error: "Trop de requêtes" });
      return;
    }
    next();
  };
}
