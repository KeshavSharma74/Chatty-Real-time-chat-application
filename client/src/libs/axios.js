import axios from "axios";

export const axiosInstance = axios.create({
  baseURL:"https://chatty-real-time-chat-application-4s51.onrender.com",
  // baseURL:"http://localhost:3000",
  withCredentials: true,
});