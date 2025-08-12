import { Router } from "express";
import { checkAuth, login, logout, signup, updateProfile } from "../controllers/auth.controller.js";
import protectRoute from "../middlewares/auth.middleware.js";

const authRoute = Router();

authRoute.post('/signup',signup);
authRoute.post('/login',login);
authRoute.post('/logout',logout);
authRoute.put('/update-profile',protectRoute,updateProfile);
authRoute.get('/check-auth',protectRoute,checkAuth);


export default authRoute;