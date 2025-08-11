import jwt from "jsonwebtoken";
import "dotenv/config";

const generateToken = async(userId,res) =>{

    const token = jwt.sign({userId},process.env.JWT_SECRET,{
        expiresIn:"7d",
    })

    res.cookie("jwt",token,{
        httpOnly:true,
        secure:true,
        maxAge:7*24*60*60*1000,
    })

}

export {generateToken}