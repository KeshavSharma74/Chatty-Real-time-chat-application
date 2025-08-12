import { Router } from "express";
import protectRoute from "../middlewares/auth.middleware.js";
import { getMessages, getUsersFromSidebar, sendMessages } from "../controllers/message.controller.js";

const messageRoute = Router();

messageRoute.get('/users',protectRoute,getUsersFromSidebar);
messageRoute.get('/:id',protectRoute,getMessages);
messageRoute.post('/send/:id',protectRoute,sendMessages);

export default messageRoute;
