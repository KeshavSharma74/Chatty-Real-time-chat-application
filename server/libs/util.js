import jwt from "jsonwebtoken";
import "dotenv/config";

const generateToken = (userId,res) =>{

    const token = jwt.sign({userId},process.env.JWT_SECRET,{
        expiresIn:"7d",
    })

    if(!token){
        return res.status(400).json({
            success:false,
            message:"Token cannot be created."
        })
    }

    res.cookie("jwt",token,{
        httpOnly:true,
        secure:true,
        sameSite: "none",
        maxAge:7*24*60*60*1000,
    })

    return token;

}

export {generateToken}