import axios from "axios";

export const axiosInstance = axios.create({
  baseURL:"https://chatty-real-time-chat-application-4s51.onrender.com",
  withCredentials: true,
});