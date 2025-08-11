import { generateToken } from "../libs/util.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";

const signup = async(req,res)=>{

    const {fullName,email,password}=req.body;

    try{

        if(!fullName || !email || !password){
            return res.status(400).json({
                success:false,
                message:"All fields are required."
            })
        }

        if(password.length<6){
            return res.status(400).json({
                success:false,
                message:"Password must be atleast 6 characters"
            })
        }

        const isPresent = await User.findOne({email});

        if(isPresent){
            return res.status(400).json({
                success:false,
                message:"Email Already Exists."
            })
        }
        
        const hashedPassword = await bcrypt.hash(password,10);

        const user = await User.create({
            fullName,
            email,
            password:hashedPassword,
        })

        if(!user){
            return res.status(400).json({
                success:false,
                message:"User cannot be created."
            })
        }

        generateToken(user._id,res);

        return res.status(200).json({
            success:true,
            message:"User Created Successfully.",
            userData:user
        })
        
    }
    catch(error){
        console.log("Error in signup controller :",error);
        return res.status(500).json({
            success:false,
            message:"Internal Server Error."
        })
    }
}

const login = async(req,res)=>{

    const {email,password} = req.body;

    try{

        if(!email || !password){

            return res.status(400).json({
                success:false,
                message:"All fields are required"
            })

        }

        const user = await User.findOne({email});

        if(!user){
            return res.status(400).json({
                success:false,
                message:"User is not registered."
            })
        }

        const isCorrectPassword = await bcrypt.compare(password,user.password);

        if(!isCorrectPassword){
            return res.status(400).json({
                success:false,
                message:"Email or password is incorrect."
            })
        }

        generateToken(user._id,res);

        return res.status(200).json({
            success:true,
            message:"User Loggedin Successfully.",
            userData:user,
        })

    }
    catch(error){
        console.log("Error in login controller :",error);
        return res.status(500).json({
            success:false,
            message:"Internal Server Error.",
        })
    }
}

const logout = async(req,res)=>{

    try{

        res.clearCookie('jwt',{
            httpOnly:true,
            secure:true,
        })

        return res.status(200).json({
            success:true,
            message:"User Logged Out Successfully."
        })

    }
    catch(error){
        
        console.log("Error in login controller :",error);
        return res.status(500).json({
            success:false,
            message:"Internal Server Error.",
        })

    }

}

export {signup,login,logout}