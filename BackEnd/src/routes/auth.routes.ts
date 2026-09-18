import { Router } from "express";
import {
  register,
  login,
  updateProfile,
  deleteAccount,
  forgotPassword,
  resetPassword,
} from "../controllers/auth.controller";
import { authRateLimiter } from "../middlewares/rateLimiter.middleware";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.post("/register", authRateLimiter, register);
router.post("/login", authRateLimiter, login);
router.put("/profile", authMiddleware, updateProfile);
router.delete("/account", authMiddleware, deleteAccount);
router.post("/forgot-password", authRateLimiter, forgotPassword);
router.post("/reset-password", authRateLimiter, resetPassword);

export default router;