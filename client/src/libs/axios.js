import axios from "axios";

export const axiosInstance = axios.create({
  baseURL:"https://chatty-real-time-chat-application.vercel.app",
  withCredentials: true,
});