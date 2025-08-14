import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../libs/cloudinary.js"; // make sure this is configured
import { getReceiverSocketId ,io} from "../libs/socket.js";

// Helper function to get profile picture URL
const getProfilePicUrl = (user, req) => {
  if (user.profilePic) {
    // If user has a profile picture, return it
    return user.profilePic;
  }
  
  // Generate avatar URL using the same logic as your sidebar
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const userName = user.fullName || user.email || 'User';
  
  // You can either use a local avatar from public folder
  // or generate one using UI Avatars with user's name
  
  // Option 1: Use local default avatar from public folder
  // return `${baseUrl}/avatar.png`; // Make sure you have avatar.png in public folder
  
  // Option 2: Generate avatar using UI Avatars API (recommended)
  const encodedName = encodeURIComponent(userName);
  return `https://ui-avatars.com/api/?name=${encodedName}&background=6366f1&color=ffffff&size=256&rounded=true&format=svg`;
};

const getUsersFromSidebar = async (req, res) => {
  const loggedInUserId = req.user._id;

  try {
    const users = await User.find({ _id: { $ne: loggedInUserId } })
      .select("fullName email profilePic");

    // Add avatar URLs to each user
    const filteredUsers = users.map(user => ({
      ...user.toObject(),
      profilePic: getProfilePicUrl(user, req)
    }));

    return res.status(200).json({
      success: true,
      message: "Sidebar Users Fetched Successfully.",
      filteredUsers,
    });
  } catch (error) {
    console.log("Error in getUsersForSidebar controller:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    }).sort({ createdAt: 1 });

    // Populate sender info for each message
    const messagesWithSenderInfo = await Promise.all(
      messages.map(async (message) => {
        const sender = await User.findById(message.senderId).select("fullName email profilePic");
        return {
          ...message.toObject(),
          senderName: sender?.fullName || sender?.email || "Unknown User",
          senderProfilePic: getProfilePicUrl(sender, req),
          senderEmail: sender?.email,
        };
      })
    );

    return res.status(200).json({
      success: true,
      message: "Messages Fetched Successfully.",
      messages: messagesWithSenderInfo,
    });
  } catch (error) {
    console.log("Error in getMessages controller:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

const sendMessages = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    if (!text && !image) {
      return res.status(400).json({
        success: false,
        message: "Message must have text or an image.",
      });
    }

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = await Message.create({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });

    // Get sender info with error handling
    const sender = await User.findById(senderId).select("fullName profilePic email");
    
    if (!sender) {
      console.warn("Sender not found for message:", senderId);
      return res.status(400).json({
        success: false,
        message: "Sender not found.",
      });
    }

    // Use the helper function to get the correct profile pic URL
    const senderProfilePic = getProfilePicUrl(sender, req);

    const messageForSocket = {
      ...newMessage.toObject(),
      senderName: sender.fullName || sender.email || "Unknown User",
      senderProfilePic: senderProfilePic,
      senderEmail: sender.email,
    };

    console.log("Sending message with sender info:", {
      senderName: messageForSocket.senderName,
      senderProfilePic: messageForSocket.senderProfilePic,
      senderId: senderId,
      receiverId: receiverId
    });

    // Send to receiver (this will trigger toast notification)
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", messageForSocket);
      console.log("Message sent to receiver:", receiverId);
    } else {
      console.log("Receiver not online:", receiverId);
    }

    // Send to sender only if they have a different socket (different device/tab)
    const senderSocketId = getReceiverSocketId(senderId);
    if (senderSocketId && senderSocketId !== receiverSocketId) {
      const messageForSender = {
        ...messageForSocket,
        fromSelf: true
      };
      io.to(senderSocketId).emit("newMessage", messageForSender);
      console.log("Message sent to sender:", senderId);
    }

    return res.status(200).json({
      success: true,
      message: "Message Created Successfully.",
      newMessage: messageForSocket,
    });
  } catch (error) {
    console.log("Error in sendMessages controller:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

export { getUsersFromSidebar, getMessages, sendMessages };