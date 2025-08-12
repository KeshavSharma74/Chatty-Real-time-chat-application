import express from "express";
import "dotenv/config"
import connectDb from "./libs/db.js";
import cookieParser from "cookie-parser";
import cors from "cors"
import authRoute from "./routes/auth.route.js";
import messageRoute from "./routes/message.route.js";

const app=express();
const port = process.env.PORT || 4000;

app.use(express.json());
app.use(cors());
app.use(cookieParser())

app.listen(port, ()=>{
    console.log(`Server is listening on port : ${port}`);
} )

app.use('/api/v1',authRoute);
app.use('/api/v1',messageRoute);

app.get('/', (req,res)=>{
    return res.send("Server is live");
} )

connectDb();

