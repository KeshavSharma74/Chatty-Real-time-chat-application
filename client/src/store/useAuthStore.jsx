import { create } from "zustand";

export const useAuthStore = create( ()=> ({
    authUser:null,
    isCheckingAuth:true,
}) )