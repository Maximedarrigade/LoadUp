import rateLimit from "express-rate-limit";

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Trop de tentatives. Réessayez dans 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Short-term guard on photo analysis, on top of the per-user daily limit (keyed by user, not IP).
export const photoRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  keyGenerator: (req) => req.userId as string,
  message: { error: "Trop d'analyses d'affilée. Patiente une minute.", code: "rate_limited" },
  standardHeaders: true,
  legacyHeaders: false,
});
