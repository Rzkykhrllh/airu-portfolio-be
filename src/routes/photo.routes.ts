import { Router } from "express";
import { getPhotos, getPhotoById, createPhoto, updatePhoto, deletePhoto } from "../controllers/photo.controller";
import { authenticateToken } from "../middlewares/auth.middleware";
import { uploadSingle } from "../middlewares/upload.middleware";


const router = Router();

// Public Routes
router.get("/", getPhotos);
router.get("/:id", getPhotoById);

// Protected Routes
router.post("/",authenticateToken, uploadSingle ,createPhoto);
router.put("/:id", authenticateToken, updatePhoto); 
router.delete("/:id", authenticateToken, deletePhoto);

export default router;