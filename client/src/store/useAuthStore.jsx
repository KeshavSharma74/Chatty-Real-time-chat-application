import { create } from "zustand";
import { axiosInstance } from "../libs/axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:3000" : import.meta.env.BACKEND_URL;

export const useAuthStore = create( (set,get)=> ({
    authUser:null,
    isSigningUp:false,
    isLoggingIn:false,
    isUpdatingProfile:false,
    isCheckingAuth:true,
    onlineUsers:[],
    socket: null,
    checkAuth: async() =>{
        try{
            const res=await axiosInstance.get('/auth/check-auth');
            if(res.data.success){
                console.log(res.data.userData);
                set({authUser:res.data.userData});
                get().connectSocket();
            }
        }
        catch(error){
            console.log("Error in checkAuth :",error);
            set({authUser:null});
        }
        finally{
            set({isCheckingAuth:false});
        }
    },
      signup: async (data) => {   
        try {
            set({ isSigningUp: true });
            const res = await axiosInstance.post("/auth/signup", data);
            if(res.data.success){
                set({ authUser: res.data.userData });
                // console.log(res.data.userData);
                toast.success("Account created successfully");
                get().connectSocket();
            }
        } catch (error) {
            toast.error(error.response.data.message);
        } finally {
      set({ isSigningUp: false });
    }
  },
  logout: async() =>{
    try{
        const res= await axiosInstance.post('/auth/logout');
        if(res.data.success){
            set({authUser:null});
            toast.success("Logged out successfully");
            get().disconnectSocket();
        }
    }
    catch(error){
        toast.error(error.message);
    }
  },
    login: async (data) => {
    
        try {
            set({ isLoggingIn: true });
            const res = await axiosInstance.post("/auth/login", data);
            if(res.data.success){
                set({ authUser: res.data.userData});
                // console.log("login function mei : ", res.data.userData);
                get.connectSocket();
                toast.success("Logged in successfully");
                get().connectSocket();
            }

        } catch (error) {
            toast.error(error.response.data.message);
        } finally {
            set({ isLoggingIn: false });
        }
  },
    updateProfile: async (data) => {
        
        try {
            set({ isUpdatingProfile: true });
            const res = await axiosInstance.put("/auth/update-profile", data);
            if(res.data.success){
                set({ authUser: res.data.updatedUser });
                toast.success("Profile updated successfully");
            }
        } catch (error) {
            console.log("error in update profile:", error);
            toast.error(error.message);
        } finally {
            set({ isUpdatingProfile: false });
        }
  },
  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;

    const socket = io(BASE_URL, {
      query: {
        userId: authUser._id,
      },
    });
    socket.connect();

    set({ socket: socket });

    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });
  },
  disconnectSocket: () => {
    if (get().socket?.connected) get().socket.disconnect();
  },
}) )