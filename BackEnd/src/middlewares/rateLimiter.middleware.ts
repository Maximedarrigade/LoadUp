import { isIP } from "net";
import type { Request } from "express";
import rateLimit, { ipKeyGenerator, type RateLimitInfo } from "express-rate-limit";

// IP du client pour le limiteur, derrière le proxy AlwaysData (mesuré le 19/10/2026) :
// - le proxy se connecte à l'appli en loopback, donc req.ip est le même pour tout le monde ;
// - il écrase X-Real-IP avec l'IP du visiteur (une valeur envoyée par le client est remplacée) ;
// - il ne pose PAS X-Forwarded-For : celui envoyé par le client arrive tel quel, falsifiable.
// D'où « trust proxy » désactivé (server.ts) : Express lirait X-Forwarded-For. On ne fait
// confiance à X-Real-IP que si la connexion vient bien du proxy (loopback).
const LOOPBACK = /^(127\.|::ffff:127\.|::1$)/;

export function clientIp(req: Request) {
  const socketIp = req.socket.remoteAddress ?? "";
  const realIp = req.get("x-real-ip")?.trim();
  if (realIp && isIP(realIp) && LOOPBACK.test(socketIp)) return realIp;
  return socketIp;
}

// Délai restant renvoyé dans le corps : l'appli web (autre domaine) ne peut pas lire
// les en-têtes RateLimit-* sans configuration CORS supplémentaire.
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  // ipKeyGenerator regroupe les IPv6 par /56, comme le comportement par défaut.
  keyGenerator: (req) => ipKeyGenerator(clientIp(req)),
  // X-Forwarded-For est volontairement ignoré (voir clientIp) : pas d'avertissement à son sujet.
  validate: { xForwardedForHeader: false },
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
