import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../libs/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  notificationAudio: null,
  soundEnabled: true,

  // Initialize audio when store is created
  initializeAudio: () => {
    try {
      const audio = new Audio("/notification.mp3");
      audio.preload = "auto";
      audio.volume = 0.5; // Set volume to 50%
      set({ notificationAudio: audio });
    } catch (error) {
      console.warn("Could not initialize notification audio:", error);
    }
  },

  // Play notification sound
  playNotificationSound: () => {
    const { notificationAudio, soundEnabled } = get();
    
    if (!soundEnabled || !notificationAudio) return;
    
    try {
      // Reset audio to beginning in case it was played recently
      notificationAudio.currentTime = 0;
      notificationAudio.play().catch((error) => {
        console.warn("Could not play notification sound:", error);
        // Fallback: try to create new audio instance
        try {
          const fallbackAudio = new Audio("/notification.mp3");
          fallbackAudio.volume = 0.5;
          fallbackAudio.play().catch(() => {});
        } catch (fallbackError) {
          console.warn("Fallback audio also failed:", fallbackError);
        }
      });
    } catch (error) {
      console.warn("Error playing notification sound:", error);
    }
  },

  // Toggle sound on/off
  toggleSound: () => {
    set((state) => ({ soundEnabled: !state.soundEnabled }));
  },

  // Set sound volume
  setSoundVolume: (volume) => {
    const { notificationAudio } = get();
    if (notificationAudio) {
      notificationAudio.volume = Math.max(0, Math.min(1, volume)); // Clamp between 0 and 1
    }
  },

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/api/messages/users");
      if (res.data.success) {
        set({ users: res.data.filteredUsers });
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/api/messages/${userId}`);
      set({ messages: res.data.messages });
    } catch (error) {
      toast.error(error.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await axiosInstance.post(
        `/api/messages/send/${selectedUser._id}`,
        messageData
      );
      set({ messages: [...messages, res.data.newMessage] });
    } catch (error) {
      toast.error(error.message);
    }
  },

  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      console.log("Received new message:", newMessage); // Debug log
      const { selectedUser, messages, users, playNotificationSound } = get();

      // If message is from the currently opened chat
      if (selectedUser && newMessage.senderId === selectedUser._id) {
        set({ messages: [...messages, newMessage] });
        // Play a softer notification for current chat
        playNotificationSound();
      } 
      // If message is from another user
      else {
        // Try to get sender name from multiple sources
        let senderName = "a user"; // default fallback
        
        // First, try from the message itself
        if (newMessage.senderName) {
          senderName = newMessage.senderName;
        } 
        // If not available, try to find from users list
        else if (newMessage.senderId) {
          const senderUser = users.find(user => user._id === newMessage.senderId);
          if (senderUser) {
            senderName = senderUser.fullName || senderUser.name || "a user";
          }
        }

        console.log("Sender name resolved to:", senderName); // Debug log

        // Show toast notification
        toast.success(`New message from ${senderName}`, {
          id: newMessage.senderId, // Avoid duplicate toasts
          duration: 4000, // Show for 4 seconds
          icon: "💬", // Message emoji
        });

        // Play notification sound
        playNotificationSound();

        // Optional: Update document title to show notification
        if (document.hidden) {
          const originalTitle = document.title;
          document.title = `🔔 New Message from ${senderName} - ${originalTitle}`;
          
          // Reset title when user focuses back on tab
          const resetTitle = () => {
            document.title = originalTitle;
            document.removeEventListener('visibilitychange', resetTitle);
          };
          document.addEventListener('visibilitychange', resetTitle);
        }
      }
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.off("newMessage");
    }
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));