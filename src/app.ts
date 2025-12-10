import express from "express";
import cors from "cors";
import helmet from "helmet";
import { timeStamp } from "console";

const app = express();

// Middlewares

// Security middleware
app.use(helmet());

// Enable CORS
app.use(cors());

// Parse JSON from request body
app.use(express.json());

// Parse URL-encoded body (form data)
app.use(express.urlencoded({extended: true }))

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

export default app;

