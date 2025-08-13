import "dotenv/config";
import path from "path";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRoute from "./routes/auth.route.js";
import messageRoute from "./routes/message.route.js";
import connectDb from "./libs/db.js";
import express from "express"

// ✅ Import shared `app` and `server` from socket.js
import { app, server } from "./libs/socket.js";

const port = process.env.PORT || 4000;
const __dirname = path.resolve();

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(cookieParser());

// API Routes
app.use("/api/auth", authRoute);
app.use("/api/messages", messageRoute);


// Start server & connect DB
server.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
  connectDb();
});
