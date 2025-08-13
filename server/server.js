import "dotenv/config";
import path from "path";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRoute from "./routes/auth.route.js";
import messageRoute from "./routes/message.route.js";
import connectDb from "./libs/db.js";
import express from "express";

// ✅ Import shared `app` and `server` from socket.js
import { app, server } from "./libs/socket.js";

const port = process.env.PORT || 4000;

// ✅ Allowed origins (dev + prod)
const allowedOrigins = [
  "http://localhost:5173",
  "https://chatty-real-time-chat-application-7.vercel.app",
];

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, etc.)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(cookieParser());

// API Routes
app.use("/api/auth", authRoute);
app.use("/api/messages", messageRoute);

app.get("/", (req, res) => {
  res.send("Server is live");
});

// Start server & connect DB
server.listen(port, () => {
  console.log(`✅ Server is running on port: ${port}`);
  connectDb();
});
