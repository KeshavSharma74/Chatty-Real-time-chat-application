import { create } from "zustand";
import { axiosInstance } from "../libs/axios";
import toast from "react-hot-toast";
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
      
      // After fetching messages, update the unread count for this user to 0
      const { users } = get();
      const updatedUsers = users.map(user => 
        user._id === userId ? { ...user, unreadCount: 0 } : user
      );
      set({ users: updatedUsers });
    } catch (error) {
      toast.error(error.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser } = get();
    try {
      await axiosInstance.post(
        `/api/messages/send/${selectedUser._id}`,
        messageData
      );
    } catch (error) {
      toast.error(error.message);
    }
  },

  // Mark messages as seen
  markMessagesAsSeen: async (userId) => {
    try {
      await axiosInstance.put(`/api/messages/mark-seen/${userId}`);
      
      // Update local state
      const { users } = get();
      const updatedUsers = users.map(user => 
        user._id === userId ? { ...user, unreadCount: 0 } : user
      );
      set({ users: updatedUsers });
    } catch (error) {
      console.error("Error marking messages as seen:", error);
    }
  },

  // Update unread count for a specific user
  updateUnreadCount: (userId, increment = true) => {
    const { users } = get();
    const updatedUsers = users.map(user => {
      if (user._id === userId) {
        const currentCount = user.unreadCount || 0;
        return { 
          ...user, 
          unreadCount: increment ? currentCount + 1 : Math.max(0, currentCount - 1)
        };
      }
      return user;
    });
    set({ users: updatedUsers });
  },

  // Reset unread count for a specific user
  resetUnreadCount: (userId) => {
    const { users } = get();
    const updatedUsers = users.map(user => 
      user._id === userId ? { ...user, unreadCount: 0 } : user
    );
    set({ users: updatedUsers });
  },

  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      console.log("Received new message:", newMessage);
      const { selectedUser, messages, users, playNotificationSound, updateUnreadCount } = get();
      const currentUserId = useAuthStore.getState().authUser?._id;

      // If this is the sender's own message, just update the UI without notifications
      if (newMessage.fromSelf || newMessage.senderId === currentUserId) {
        if (selectedUser && newMessage.receiverId === selectedUser._id) {
          set({ messages: [...messages, newMessage] });
        }
        return;
      }

      // If message is from the currently opened chat (selectedUser is not null and matches sender)
      if (selectedUser && newMessage.senderId === selectedUser._id) {
        set({ messages: [...messages, newMessage] });
        playNotificationSound();
        
        // Mark the message as seen since the chat is open
        get().markMessagesAsSeen(newMessage.senderId);
      } 
      // If no user is selected (selectedUser is null) OR message is from a different user
      else {
        console.log("Message from different user or no user selected:", { selectedUser, senderId: newMessage.senderId });
        
        // Update unread count for this user - THIS IS CRUCIAL FOR BOTH CASES
        updateUnreadCount(newMessage.senderId, true);

        // Get sender info for notification
        let senderName = "a user";
        let senderProfilePic = "https://ui-avatars.com/api/?name=User&background=6366f1&color=ffffff&size=256&rounded=true&format=svg";
        let messageText = newMessage.text || "📷 Image";
        
        if (newMessage.senderName) {
          senderName = newMessage.senderName;
          const initials = senderName.split(' ').map(word => word.charAt(0)).join('').substring(0, 2).toUpperCase();
          senderProfilePic = newMessage.senderProfilePic || 
            `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=6366f1&color=ffffff&size=256&rounded=true&format=svg`;
        } else if (newMessage.senderId) {
          const senderUser = users.find(user => user._id === newMessage.senderId);
          if (senderUser) {
            senderName = senderUser.fullName || senderUser.name || "a user";
            const initials = senderName.split(' ').map(word => word.charAt(0)).join('').substring(0, 2).toUpperCase();
            senderProfilePic = senderUser.profilePic || 
              `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=6366f1&color=ffffff&size=256&rounded=true&format=svg`;
          }
        }

        console.log("Showing notification for:", { senderName, selectedUser: selectedUser?.fullName || 'null' });

        // Show toast notification for ANY message when:
        // 1. No user is selected (selectedUser is null) - MAIN FIX HERE
        // 2. Message is from a different user than currently selected
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
                      const initials = senderName.split(' ').map(word => word.charAt(0)).join('').substring(0, 2).toUpperCase();
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=6366f1&color=ffffff&size=256&rounded=true&format=svg`;
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
          id: `${newMessage.senderId}-${Date.now()}`,
          duration: 1300,
        });

        playNotificationSound();

        // Update document title to show notification
        if (document.hidden) {
          const originalTitle = document.title;
          document.title = `🔔 New Message from ${senderName}`;
          
          const resetTitle = () => {
            if (!document.hidden) {
              document.title = originalTitle;
              document.removeEventListener('visibilitychange', resetTitle);
            }
          };
          document.addEventListener('visibilitychange', resetTitle);
        }
      }
    });

    // Listen for messages marked as seen event
    socket.on("messagesMarkedAsSeen", ({ chatUserId, userId }) => {
      const currentUserId = useAuthStore.getState().authUser?._id;
      
      // Only update if this event is relevant to current user
      if (userId === currentUserId) {
        get().resetUnreadCount(chatUserId);
      }
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.off("newMessage");
      socket.off("messagesMarkedAsSeen");
    }
  },

  setSelectedUser: (selectedUser) => {
    set({ selectedUser });
    
    // When a user is selected, mark their messages as seen
    if (selectedUser) {
      get().markMessagesAsSeen(selectedUser._id);
    }
  },
}));