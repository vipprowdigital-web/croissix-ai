import { Router } from "express";
import {
  adminRegister,
  adminLogin,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getAllSubscriptions,
  getDashboardStats,
} from "../controllers/admin.controller.js";
import { ensureAdmin } from "../middleware/adminMiddleware.js";

const router = Router();

// Auth
router.post("/register", adminRegister);
router.post("/login", adminLogin);

// Dashboard stats
router.get("/stats", ensureAdmin, getDashboardStats);

// Users
router.get("/users", ensureAdmin, getAllUsers);
router.get("/users/:id", ensureAdmin, getUserById);
router.patch("/users/:id", ensureAdmin, updateUser);
router.delete("/users/:id", ensureAdmin, deleteUser);

// Subscriptions
router.get("/subscriptions", ensureAdmin, getAllSubscriptions);

export default router;
