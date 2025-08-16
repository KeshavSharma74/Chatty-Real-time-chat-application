import { Router } from "express";
import protectRoute from "../middlewares/auth.middleware.js";
import { getMessages, getUsersFromSidebar, sendMessages,markMessagesAsSeen } from "../controllers/message.controller.js";

const messageRoute = Router();

messageRoute.get('/users',protectRoute,getUsersFromSidebar);
messageRoute.get('/:id',protectRoute,getMessages);
messageRoute.post('/send/:id',protectRoute,sendMessages);
messageRoute.put("/mark-seen/:id", protectRoute, markMessagesAsSeen);

export default messageRoute;
