import { User } from "../models/userModel.js";
import { ConnectionRequest } from "../models/requestModel.js";
import { io, onlineUsers } from "../socket.js";
import { Message } from "../models/messageModel.js";
import { Notification } from "../models/notificationModel.js";

export const sendRequest = async (req, res) => {
   try {
      const senderId = req.user._id;
      const receiverId = req.params.id;

      if (senderId.toString() === receiverId) {
         return res.status(400).json({ message: "You cannot send request to yourself" });
      }

      const receiver = await User.findById(receiverId);

      if (!receiver) {
         return res.status(404).json({ message: "User not found" });
      }

      const existingRequest = await ConnectionRequest.findOne({
         $or: [
            { senderId, receiverId },
            { senderId: receiverId, receiverId: senderId }
         ],
         status: {
            $in: ["pending", "accepted"]
         }
      });

      if (existingRequest) {
         return res.status(400).json({ message: "Request already exists" });
      }

      const request = await ConnectionRequest.create({
         senderId,
         receiverId
      });

      const populatedRequest = await ConnectionRequest.findById(request._id)
         .populate("senderId", "username email");

      const senderSocketId = onlineUsers.get(senderId.toString());

      if (senderSocketId) {
         io.to(senderSocketId).emit("requestSent", {
            _id: request._id,
            receiverId: {
               _id: receiver._id,
               username: receiver.username,
               email: receiver.email
            }
         });
      }

      const receiverSocketId = onlineUsers.get(receiverId.toString());

      if (receiverSocketId) {
         io.to(receiverSocketId).emit("newRequest", populatedRequest);
      }

      const notification =await Notification.create({

            senderId,
            receiverId,

            message:"sent you a friend request"

         });

         const populatedNotification =
         await Notification.findById(
            notification._id
         )
         .populate(
            "senderId",
            "username"
         );

         if(receiverSocketId){

            io.to(receiverSocketId).emit(
               "new-notification",
               populatedNotification
            );

         }

      return res.status(201).json({
         message: "Request sent successfully",
         request
      });

   } catch (error) {
      console.log(error);

      return res.status(500).json({
         message: "server error"
      });
   }
};

export const incomingRequest = async (req, res) => {
   try {
      const requests = await ConnectionRequest.find({
         receiverId: req.user._id,
         status: "pending"
      }).populate("senderId", "username email");

      return res.status(200).json({ requests });

   } catch (error) {
      console.log(error);

      return res.status(500).json({
         message: "server error"
      });
   }
};

export const acceptRequest = async (req, res) => {
   try {
      const request = await ConnectionRequest.findById(req.params.id);

      if (!request) {
         return res.status(404).json({ message: "Request not found" });
      }

      if (request.receiverId.toString() !== req.user._id.toString()) {
         return res.status(403).json({ message: "Unauthorized" });
      }

      request.status = "accepted";
      await request.save();

      const sender = await User.findById(request.senderId)
         .select("username email");

      const receiver = await User.findById(request.receiverId)
         .select("username email");

      const senderSocketId = onlineUsers.get(request.senderId.toString());

      if (senderSocketId) {
         io.to(senderSocketId).emit("requestAccepted", {
            requestId: request._id,
            receiverId: request.receiverId.toString()
         });

         io.to(senderSocketId).emit("friendAdded", receiver);
      }

      const receiverSocketId = onlineUsers.get(request.receiverId.toString());

      if (receiverSocketId) {
         io.to(receiverSocketId).emit("friendAdded", sender);
      }

      const notification = await Notification.create({

            senderId:req.user._id,

            receiverId:request.senderId,

            message:"accepted your friend request"

         });

         const populatedNotification =
         await Notification.findById(
            notification._id
         )
         .populate(
            "senderId",
            "username "
         );

         if(senderSocketId){

            io.to(senderSocketId).emit(
               "new-notification",
               populatedNotification
            );

         }

      return res.status(200).json({
         message: "request accepted",
         request
      });

   } catch (error) {
      console.log(error);

      return res.status(500).json({
         message: "server error"
      });
   }
};

export const rejectRequest = async (req, res) => {
   try {
      const request = await ConnectionRequest.findById(req.params.id);

      if (!request) {
         return res.status(404).json({ message: "Request not found" });
      }

      if (request.receiverId.toString() !== req.user._id.toString()) {
         return res.status(403).json({ message: "Unauthorized" });
      }

      request.status = "rejected";
      await request.save();

      const senderSocketId = onlineUsers.get(request.senderId.toString());

      if (senderSocketId) {
         io.to(senderSocketId).emit("requestRejected", {
            requestId: request._id,
            receiverId: request.receiverId.toString()
         });
      }

      const notification =
         await Notification.create({

            senderId:req.user._id,

            receiverId:request.senderId,

            message:"rejected your friend request"

         });

         const populatedNotification =
         await Notification.findById(
            notification._id
         )
         .populate(
            "senderId",
            "username profilePic"
         );

         if(senderSocketId){

            io.to(senderSocketId).emit(
               "new-notification",
               populatedNotification
            );

         }

      return res.status(200).json({
         message: "request rejected",
         request
      });

   } catch (error) {
      console.log(error);

      return res.status(500).json({
         message: "server error"
      });
   }
};

export const getAcceptedUsers = async (req, res) => {

   try {

      const userId = req.user._id;

      const connections =
         await ConnectionRequest.find({

            $or: [
               { senderId: userId },
               { receiverId: userId }
            ],

            status: "accepted"

         })
         .populate(
            "senderId",
            "username email lastSeen"
         )
         .populate(
            "receiverId",
            "username email lastSeen"
         );

      const users = await Promise.all(

         connections.map(async (connection) => {

            const user =
               connection.senderId._id.toString() ===
               userId.toString()
                  ? connection.receiverId
                  : connection.senderId;

            const lastMessage =
               await Message.findOne({

                  $or: [
                     {
                        senderId: userId,
                        receiverId: user._id
                     },
                     {
                        senderId: user._id,
                        receiverId: userId
                     }
                  ]

               })
               .sort({
                  createdAt: -1
               });

            return {
               ...user.toObject(),
               lastMessage:
                  lastMessage?.text || "",
               lastMessageTime:
                  lastMessage?.createdAt || null
            };

         })

      );

      return res.status(200).json({

         message:
            "Connection fetched successfully",

         users

      });

   } catch (error) {

      console.log(error);

      return res.status(500).json({
         message: `error : ${error.message}`
      });

   }

};

export const sentRequests = async (req, res) => {
   try {
      const requests = await ConnectionRequest.find({
         senderId: req.user._id,
         status: "pending"
      })
         .populate("receiverId", "username email lastSeen")
         .sort({ createdAt: -1 });

      return res.status(200).json({ requests });

   } catch (error) {
      console.log(error);

      return res.status(500).json({
         message: "Server error!"
      });
   }
};

export const cancelRequest = async (req, res) => {
   try {
      const { id } = req.params;

      const request = await ConnectionRequest.findOne({
         _id: id,
         senderId: req.user._id,
         status: "pending"
      });

      if (!request) {
         return res.status(404).json({ message: "Request not found" });
      }

      await ConnectionRequest.findByIdAndDelete(id);

      const payload = {
         requestId: request._id,
         senderId: request.senderId.toString(),
         receiverId: request.receiverId.toString()
      };

      const senderSocketId = onlineUsers.get(request.senderId.toString());
      const receiverSocketId = onlineUsers.get(request.receiverId.toString());

      if (senderSocketId) {
         io.to(senderSocketId).emit("requestCancelled", payload);
      }

      if (receiverSocketId) {
         io.to(receiverSocketId).emit("requestCancelled", payload);
      }

      return res.status(200).json({
         message: "Request cancelled successfully"
      });

   } catch (error) {
      console.log(error);

      return res.status(500).json({
         message: "Server error!"
      });
   }
};

export const removeFriend = async (req, res) => {
   try {
      const userId = req.user._id;
      const friendId = req.params.id;

      const connection = await ConnectionRequest.findOne({
         $or: [
            {
               senderId: userId,
               receiverId: friendId
            },
            {
               senderId: friendId,
               receiverId: userId
            }
         ],
         status: "accepted"
      });

      if (!connection) {
         return res.status(404).json({ message: "Friend not found" });
      }

      await ConnectionRequest.findByIdAndDelete(connection._id);

      const payload = {
         friendId: friendId.toString(),
         userId: userId.toString()
      };

      const userSocketId = onlineUsers.get(userId.toString());
      const friendSocketId = onlineUsers.get(friendId.toString());

      if (userSocketId) {
         io.to(userSocketId).emit("friendRemoved", payload);
      }

      if (friendSocketId) {
         io.to(friendSocketId).emit("friendRemoved", payload);
      }

      return res.status(200).json({
         message: "Friend removed"
      });

   } catch (error) {
      console.log(error);

      return res.status(500).json({
         message: "server error"
      });
   }
};