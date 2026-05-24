import { Message } from "../models/messageModel.js";
import { io, onlineUsers } from "../socket.js";

export const sendMessage = async (req, res) => {
   try {
      const senderId = req.user._id;
      const receiverId = req.params.id;
      const { text } = req.body;

      // create message
      const message = await Message.create({
         senderId,
         receiverId,
         text
      });

      // populate message
      const populatedMessage = await Message.findById(message._id)
         .populate("senderId", "username lastSeen")
         .populate("receiverId", "username lastSeen");

      // socket ids
      const receiverSocketId = onlineUsers.get(receiverId.toString());
      const senderSocketId = onlineUsers.get(senderId.toString());

      // emit to receiver
      if (receiverSocketId) {
         io.to(receiverSocketId).emit(
            "receiveMessage",
            populatedMessage
         );
      }

      // emit to sender
      if (senderSocketId) {
         io.to(senderSocketId).emit(
            "receiveMessage",
            populatedMessage
         );
      }

      return res.status(201).json({
         message: populatedMessage
      });

   } catch (error) {
      console.log(error);

      return res.status(500).json({
         message: `error: ${error.message}`
      });
   }
};

export const getMessages = async (req, res) => {
   try {
      const senderId = req.user._id;
      const receiverId = req.params.id;

      const messages = await Message.find({
         $or: [
            {
               senderId,
               receiverId
            },
            {
               senderId: receiverId,
               receiverId: senderId
            }
         ]
      })
         .populate("senderId", "username lastSeen")
         .populate("receiverId", "username lastSeen")
         .sort({ createdAt: 1 });

      return res.status(200).json({
         messages
      });

   } catch (error) {
      console.log(error);

      return res.status(500).json({
         message: "server error"
      });
   }
};

export const deleteMessage = async (req, res) => {
   try {
      const userId = req.user._id;
      const messageId = req.params.id;

      const message = await Message.findById(messageId);

      if (!message) {
         return res.status(404).json({
            message: "Message not found"
         });
      }

      if (message.senderId.toString() !== userId.toString()) {
         return res.status(403).json({
            message: "Unauthorized"
         });
      }

      await Message.findByIdAndDelete(messageId);

      const payload = { messageId };

      const receiverSocketId = onlineUsers.get(
         message.receiverId.toString()
      );

      const senderSocketId = onlineUsers.get(
         message.senderId.toString()
      );

      if (receiverSocketId) {
         io.to(receiverSocketId).emit(
            "messageDeleted",
            payload
         );
      }

      if (senderSocketId) {
         io.to(senderSocketId).emit(
            "messageDeleted",
            payload
         );
      }

      return res.status(200).json({
         message: "Deleted"
      });

   } catch (error) {
      console.log(error);

      return res.status(500).json({
         message: "server error"
      });
   }
};