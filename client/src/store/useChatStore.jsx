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
    const { selectedUser } = get();
    try {
      await axiosInstance.post(
        `/api/messages/send/${selectedUser._id}`,
        messageData
      );
      // Don't add the message here immediately - let the socket event handle it
      // This prevents duplicate messages on sender's side
      // set({ messages: [...messages, res.data.newMessage] });
    } catch (error) {
      toast.error(error.message);
    }
  },

  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      console.log("Received new message:", newMessage); // Debug log
      const { selectedUser, messages, users, playNotificationSound } = get();
      const currentUserId = useAuthStore.getState().authUser?._id;

      // If this is the sender's own message, just update the UI without notifications
      if (newMessage.fromSelf || newMessage.senderId === currentUserId) {
        if (selectedUser && newMessage.receiverId === selectedUser._id) {
          set({ messages: [...messages, newMessage] });
        }
        return; // Don't show notifications for own messages
      }

      // If message is from the currently opened chat
      if (selectedUser && newMessage.senderId === selectedUser._id) {
        set({ messages: [...messages, newMessage] });
        // Play notification sound for current chat
        playNotificationSound();
      } 
      // If message is from another user (not currently open chat) OR no user is selected
      else {
        // Get sender info from multiple sources
        let senderName = "a user"; // default fallback
        let senderProfilePic = "https://ui-avatars.com/api/?name=User&background=6366f1&color=ffffff&size=256&rounded=true&format=svg"; // default user icon
        let messageText = newMessage.text || "📷 Image"; // fallback for image messages
        
        // First, try from the message itself
        if (newMessage.senderName) {
          senderName = newMessage.senderName;
          // Create personalized avatar with user's initials
          const initials = senderName.split(' ').map(word => word.charAt(0)).join('').substring(0, 2).toUpperCase();
          senderProfilePic = newMessage.senderProfilePic || 
            `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=6366f1&color=ffffff&size=256&rounded=true&format=svg`;
        } 
        // If not available, try to find from users list
        else if (newMessage.senderId) {
          const senderUser = users.find(user => user._id === newMessage.senderId);
          if (senderUser) {
            senderName = senderUser.fullName || senderUser.name || "a user";
            const initials = senderName.split(' ').map(word => word.charAt(0)).join('').substring(0, 2).toUpperCase();
            senderProfilePic = senderUser.profilePic || 
              `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=6366f1&color=ffffff&size=256&rounded=true&format=svg`;
          }
        }

        console.log("Sender info resolved:", { senderName, senderProfilePic, messageText, selectedUser }); // Debug log

        // Show custom toast notification for messages when:
        // 1. No user is selected (selectedUser is null)
        // 2. Message is from a different user than the currently selected one
        console.log("Showing notification - selectedUser:", selectedUser, "senderId:", newMessage.senderId);
        
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
          id: `${newMessage.senderId}-${Date.now()}`, // Use timestamp to allow multiple notifications from same sender
          duration: 1300, // Show for 6 seconds
        });

        // Play notification sound
        playNotificationSound();

        // Update document title to show notification
        if (document.hidden) {
          const originalTitle = document.title;
          document.title = `🔔 New Message from ${senderName}`;
          
          // Reset title when user focuses back on tab
          const resetTitle = () => {
            if (!document.hidden) {
              document.title = originalTitle;
              document.removeEventListener('visibilitychange', resetTitle);
            }
          };
          document.addEventListener('visibilitychange', resetTitle);
        }

        // If no user is selected, we might want to update the users list to show unread indicator
        // This depends on your UI implementation
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