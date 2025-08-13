import { create } from "zustand";
import { axiosInstance } from "../libs/axios";
import toast from "react-hot-toast";

export const useAuthStore = create( (set)=> ({
    authUser:null,
    isSigningUp:false,
    isLoggingIn:false,
    isUpdatingProfile:false,
    isCheckingAuth:true,
    onlineUsers:[],
    checkAuth: async() =>{
        try{
            const res=await axiosInstance.get('/auth/check-auth');
            if(res.data.success){
                console.log(res.data.userData);
                set({authUser:res.data.userData});
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
            toast.success("Logged out successfully")
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
                toast.success("Logged in successfully");
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
}) )