import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../libs/cloudinary.js"; // make sure this is configured
import { getReceiverSocketId ,io} from "../libs/socket.js";


const getUsersFromSidebar = async (req, res) => {
  const loggedInUserId = req.user._id;

  try {
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } })
      .select("fullName email profilePic"); // safer

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

    return res.status(200).json({
      success: true,
      message: "Messages Fetched Successfully.",
      messages,
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

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    return res.status(200).json({
      success: true,
      message: "Message Created Successfully.",
      newMessage,
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
