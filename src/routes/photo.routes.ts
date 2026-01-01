import { Router } from "express";
import { getPhotos, getPhotoById, createPhoto, updatePhoto, deletePhoto } from "../controllers/photo.controller";
import { authenticateToken, optionalAuth } from "../middlewares/auth.middleware";
import { uploadSingle } from "../middlewares/upload.middleware";


const router = Router();

// Public Routes (with optional auth for scope=admin)
router.get("/", optionalAuth, getPhotos);
router.get("/:id", optionalAuth, getPhotoById);

// Protected Routes
router.post("/",authenticateToken, uploadSingle ,createPhoto);
router.put("/:id", authenticateToken, updatePhoto); 
router.delete("/:id", authenticateToken, deletePhoto);

export default router;