import rateLimit, { type RateLimitInfo } from "express-rate-limit";

// Délai restant renvoyé dans le corps : l'appli web (autre domaine) ne peut pas lire
// les en-têtes RateLimit-* sans configuration CORS supplémentaire.
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, _next, options) => {
    const resetTime = (req as typeof req & { rateLimit?: RateLimitInfo }).rateLimit?.resetTime;
    const retryAfterSeconds = resetTime
      ? Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000))
      : Math.ceil(options.windowMs / 1000);
    const minutes = Math.ceil(retryAfterSeconds / 60);
    res.status(options.statusCode).json({
      error: `Trop de tentatives. Réessaie dans ${minutes} minute${minutes > 1 ? "s" : ""}.`,
      code: "rate_limited",
      retryAfterSeconds,
    });
  },
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
