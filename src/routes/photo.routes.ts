import { Router } from "express";
import { getPhotos, getPhotoById } from "../controllers/photo.controller";


const router = Router();

// Public Routes
router.get("/", getPhotos)
router.get("/:id", getPhotoById);

export default router;