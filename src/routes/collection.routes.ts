import { Router } from "express";
import { authenticateToken, optionalAuth } from "../middlewares/auth.middleware";
import {
  createCollection,
  deleteCollection,
  deleteCollectionBySlug,
  getCollections,
  getCollectionsbySlug,
  updateCollection,
  updateCollectionBySlug,
} from "../controllers/collection.controller";

const router = Router();

// Public Routes (with optional auth for scope=admin)
router.get("/", optionalAuth, getCollections);
router.get("/slug/:slug", optionalAuth, getCollectionsbySlug);

// Protected Routes
router.post("/", authenticateToken, createCollection);
router.put("/:id", authenticateToken, updateCollection);
router.put("/slug/:slug", authenticateToken, updateCollectionBySlug);
router.delete("/:id", authenticateToken, deleteCollection);
router.delete("/slug/:slug", authenticateToken, deleteCollectionBySlug);

export default router;
