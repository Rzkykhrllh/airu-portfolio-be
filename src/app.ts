import express from "express";
import cors from "cors";
import helmet from "helmet";
import { timeStamp } from "console";
import authRoutes from "./routes/auth.routes";
import photoRoutes from "./routes/photo.routes";
import collectionRoutes from "./routes/collection.routes";
import inquiryRoutes from "./routes/inquiry.routes";
import { authenticateToken } from "./middlewares/auth.middleware";
import { errorHandler } from "./middlewares/error.middleware";

const app = express();

// Behind Nginx (single reverse-proxy hop per DEPLOYMENT-GUIDE.md) — trust its
// X-Forwarded-For so req.ip (and express-rate-limit's default key) resolves
// to the real client IP instead of the proxy's, and so it doesn't reject
// requests as an unexpected/spoofable forwarded-for header.
app.set("trust proxy", 1);

// Middlewares

// Security middleware
app.use(helmet());

// Enable CORS
app.use(cors());

// Parse JSON from request body
app.use(express.json());

// Parse URL-encoded body (form data)
app.use(express.urlencoded({extended: true }))

// Authentication routes
app.use("/auth", authRoutes);
app.use("/photos", photoRoutes);
app.use("/collections", collectionRoutes);
app.use("/inquiries", inquiryRoutes);


app.get("/user/health", authenticateToken, (req, res) => {
  res.json(
    {
      status: "Successfully authenticated",
      timeStamp: new Date().toISOString(),
    }
  )
});

app.get("/health", (req, res) => {
  res.json(
    {
      status: "ok",
      timeStamp: new Date().toISOString(),
    }
  )
});

app.get("/api/test", (req,res) => {
  res.json({ message: "API is working!" });
})

// Error handler middleware (MUST be last)
app.use(errorHandler);

export default app;

