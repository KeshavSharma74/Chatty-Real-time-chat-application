import express from "express";
import "dotenv/config";
import connectDb from "./libs/db.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRoute from "./routes/auth.route.js";
import messageRoute from "./routes/message.route.js";

const app = express();
const port = process.env.PORT || 4000;

app.use(express.json());

// ✅ Allow all origins
app.use(cors({
    origin: "http://localhost:5173", // explicitly allow frontend origin
    credentials: true
}));


app.use(cookieParser());

app.listen(port, () => {
    console.log(`Server is listening on port : ${port}`);
});

app.use('/api/auth', authRoute);
app.use('/api/message', messageRoute);

app.get('/', (req, res) => {
    return res.send("Server is live");
});

connectDb();
