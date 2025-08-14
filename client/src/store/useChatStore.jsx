import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../libs/axios";
import { useAuthStore } from "./useAuthStore";

// Helper function to get avatar URL
const getAvatarUrl = (user) => {
  if (user?.profilePic) {
    return user.profilePic;
  }
  
  // Generate avatar using UI Avatars with user's name
  const userName = user?.fullName || user?.name || user?.email || 'User';
  const encodedName = encodeURIComponent(userName);
  return `https://ui-avatars.com/api/?name=${encodedName}&background=6366f1&color=ffffff&size=256&rounded=true&format=svg`;
};

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
      audio.volume = 0.5;
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
      notificationAudio.currentTime = 0;
      notificationAudio.play().catch((error) => {
        console.warn("Could not play notification sound:", error);
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
      notificationAudio.volume = Math.max(0, Math.min(1, volume));
    }
  },

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/api/messages/users");
      if (res.data.success) {
        // Backend now handles avatar URLs, but add fallback just in case
        const usersWithAvatars = res.data.filteredUsers.map(user => ({
          ...user,
          profilePic: user.profilePic || getAvatarUrl(user)
        }));
        set({ users: usersWithAvatars });
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
      // Backend now includes sender info with avatars for each message
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
      console.log("Received new message:", newMessage);
      const { selectedUser, messages, users, playNotificationSound } = get();
      const currentUserId = useAuthStore.getState().authUser?._id;

      // If message is from the currently opened chat
      if (selectedUser && newMessage.senderId === selectedUser._id) {
        set({ messages: [...messages, newMessage] });
        if (newMessage.senderId !== currentUserId) {
          playNotificationSound();
        }
      } 
      // If message is from another user (not from self) - either no user selected or different user
      else if ((newMessage.senderId !== currentUserId || selectedUser===null) && !newMessage.fromSelf ) {
        // Get sender info - backend now provides this
        let senderName = newMessage.senderName || "a user";
        let senderProfilePic = newMessage.senderProfilePic;
        let messageText = newMessage.text || "📷 Image";
        
        // Fallback for profile pic if backend didn't provide it
        if (!senderProfilePic) {
          const senderUser = users.find(user => user._id === newMessage.senderId);
          senderProfilePic = senderUser ? getAvatarUrl(senderUser) : getAvatarUrl({ fullName: senderName });
        }

        console.log("Sender info resolved:", { senderName, senderProfilePic, messageText });

        // Show custom toast notification
        toast.custom((t) => (
          <div
            className={`${
              t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
          >
            <div className="flex-1 w-0 p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  <img
                    className="h-10 w-10 rounded-full object-cover"
                    src={senderProfilePic}
                    alt={senderName}
                    onError={(e) => {
                      // Fallback to UI Avatars if image fails to load
                      const fallbackName = encodeURIComponent(senderName);
                      e.target.src = `https://ui-avatars.com/api/?name=${fallbackName}&background=6366f1&color=ffffff&size=256&rounded=true&format=svg`;
                    }}
                  />
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {senderName}
                  </p>
                  <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                    {messageText}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex border-l border-gray-200">
              <button
                onClick={() => toast.dismiss(t.id)}
                className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Close
              </button>
            </div>
          </div>
        ), {
          id: newMessage.senderId,
          duration: 6000,
        });

        // Play notification sound
        playNotificationSound();

        // Update document title if tab is hidden
        if (document.hidden) {
          const originalTitle = document.title;
          document.title = `🔔 New Message from ${senderName} - ${originalTitle}`;
          
          const resetTitle = () => {
            document.title = originalTitle;
            document.removeEventListener('visibilitychange', resetTitle);
          };
          document.addEventListener('visibilitychange', resetTitle);
        }
      }
      // If message is from self, just add to messages if it's for the current chat
      else if (newMessage.senderId === currentUserId && selectedUser && newMessage.receiverId === selectedUser._id) {
        set({ messages: [...messages, newMessage] });
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