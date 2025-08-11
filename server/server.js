import express from "express";
import "dotenv/config"
import connectDb from "./libs/db.js";

const app=express();
const port = process.env.PORT || 4000;

app.listen(port, ()=>{
    console.log(`Server is listening on port : ${port}`);
} )

app.get('/', (req,res)=>{
    return res.send("Server is live");
} )

connectDb();

