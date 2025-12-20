import { Router } from "express";
import { getPhotos, getPhotoById, createPhoto } from "../controllers/photo.controller";
import { authenticateToken } from "../middlewares/auth.middleware";


const router = Router();

// Public Routes
router.get("/", getPhotos)
router.get("/:id", getPhotoById);

// Protected Routes
router.post("/",authenticateToken ,createPhoto);

export default router;