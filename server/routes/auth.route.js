import { Router } from "express";
import { login, signup } from "../controllers/auth.controller.js";

const authRoute = Router();

authRoute.post('/signup',signup);
authRoute.post('/login',login)