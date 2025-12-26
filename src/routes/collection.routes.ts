import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.middleware";
import {
  createCollection,
  deleteCollection,
  getCollections,
  getCollectionsbySlug,
  updateCollection,
} from "../controllers/collection.controller";

const router = Router();

// Public Routes
router.get("/", getCollections);
router.get("/slug/:slug", getCollectionsbySlug);

// Protected Routes
router.post("/", authenticateToken, createCollection);
router.put("/:id", authenticateToken, updateCollection);
router.delete("/:id", authenticateToken, deleteCollection);

export default router;
