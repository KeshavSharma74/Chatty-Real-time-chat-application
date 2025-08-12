import cloudinary from "../libs/cloudinary.js";
import { generateToken } from "../libs/util.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";

const signup = async (req, res) => {
    const { fullName, email, password } = req.body;

    try {
        if (!fullName || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required."
            });
        }

        // console.log("password : ",password);
        // console.log("password length : ",password.length);
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters long."
            });
        }

        const isPresent = await User.findOne({ email });
        if (isPresent) {
            return res.status(400).json({
                success: false,
                message: "Email already exists."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            fullName,
            email,
            password: hashedPassword,
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User could not be created."
            });
        }

        generateToken(user._id, res);

        const { password: _, ...safeUser } = user._doc;

        return res.status(201).json({
            success: true,
            message: "User created successfully.",
            userData: safeUser
        });

    } catch (error) {
        console.log("Error in signup controller:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required."
            });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User is not registered."
            });
        }

        const isCorrectPassword = await bcrypt.compare(password, user.password);
        if (!isCorrectPassword) {
            return res.status(400).json({
                success: false,
                message: "Email or password is incorrect."
            });
        }

        generateToken(user._id, res);

        const { password: _, ...safeUser } = user._doc;

        return res.status(200).json({
            success: true,
            message: "User logged in successfully.",
            userData: safeUser
        });

    } catch (error) {
        console.log("Error in login controller:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
};

const logout = async (req, res) => {
    try {
        res.clearCookie("jwt", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict"
        });

        return res.status(200).json({
            success: true,
            message: "User logged out successfully."
        });

    } catch (error) {
        console.log("Error in logout controller:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { profilePic } = req.body;
        const userId = req.user._id;

        if (!profilePic) {
            return res.status(400).json({
                success: false,
                message: "Profile picture is required."
            });
        }

        const uploadResponse = await cloudinary.uploader.upload(profilePic, {
            folder: "profile_pictures"
        });

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { profilePic: uploadResponse.secure_url },
            { new: true }
        ).select("-password");

        return res.status(200).json({
            success: true,
            message: "Profile picture updated successfully.",
            updatedUser
        });

    } catch (error) {
        console.log("Error in updateProfile controller:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
};

const checkAuth = async (req, res) => {
    try {
        return res.status(200).json({
            success: true,
            message: "Authentication checked successfully.",
            userData: req.user
        });

    } catch (error) {
        console.log("Error in checkAuth controller:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
};

export { signup, login, logout, updateProfile, checkAuth };
