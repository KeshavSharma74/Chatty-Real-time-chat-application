import "dotenv/config";
import path from "path";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRoute from "./routes/auth.route.js";
import messageRoute from "./routes/message.route.js";
import { connectDb,demochetan } from "./libs/db.js";
import express from "express";

// ✅ Import shared `app` and `server` from socket.js
import { app, server } from "./libs/socket.js";

const port = process.env.PORT || 4000;


// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://chatty-real-time-chat-application-7.vercel.app"
  ],
  credentials: true
}));
app.use(cookieParser());

// API Routes
app.use("/api/auth", authRoute);
app.use("/api/messages", messageRoute);

console.log("ab connect db function mei ja rhe hain jii");
connectDb();
console.log("ab connect db function se bahar agya jii")

app.get("/", (req, res) => {
  res.send("Server is live");
  console.log("home page wala demo chetan hai jii : ",demochetan);
});


// Start server & connect DB
server.listen(port, () => {
  console.log(`✅ Server is running on port: ${port}`);
  
});
