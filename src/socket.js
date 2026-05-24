// backend socket.js

import http from "http";
import { Server } from "socket.io";
import { User } from "./models/userModel.js";

export const onlineUsers = new Map();

export let io;

export const initializeSocket = (app) => {

   const server = http.createServer(app);

   io = new Server(server, {
      cors: {
         origin: process.env.FRONTEND_URL,
         credentials: true
      }
   });

   io.on("connection", async (socket) => {

      const userId =
         socket.handshake.query.userId;

      if (userId) {

         if (onlineUsers.has(userId)) {

            const oldSocketId =
               onlineUsers.get(userId);

            const oldSocket =
               io.sockets.sockets.get(oldSocketId);

            if (oldSocket) {
               oldSocket.disconnect();
            }

         }

         onlineUsers.set(
            userId,
            socket.id
         );

         io.emit(
            "user-online",
            userId
         );

         io.emit(
            "online-users",
            Array.from(
               onlineUsers.keys()
            )
         );

      }

      console.log(
         "User connected:",
         socket.id
      );

      socket.on(
         "get-online-users",
         () => {

            io.to(socket.id).emit(
               "online-users",
               Array.from(
                  onlineUsers.keys()
               )
            );

         }
      );

      // typing start
      socket.on(
         "typing",
         ({ senderId, receiverId }) => {

            const receiverSocketId =
               onlineUsers.get(receiverId);

            if (receiverSocketId) {

               io.to(receiverSocketId).emit(
                  "typing",
                  senderId
               );

            }

         }
      );

      // typing stop
      socket.on(
         "stop-typing",
         ({ senderId, receiverId }) => {

            const receiverSocketId =
               onlineUsers.get(receiverId);

            if (receiverSocketId) {

               io.to(receiverSocketId).emit(
                  "stop-typing",
                  senderId
               );

            }

         }
      );

      socket.on(
         "disconnect",
         async () => {

            if (
               onlineUsers.get(userId) ===
               socket.id
            ) {

               onlineUsers.delete(userId);

               const lastSeen =
                  new Date();

               await User.findByIdAndUpdate(
                  userId,
                  { lastSeen }
               );

               io.emit(
                  "user-offline",
                  {
                     userId,
                     lastSeen
                  }
               );

               io.emit(
                  "online-users",
                  Array.from(
                     onlineUsers.keys()
                  )
               );

            }

            console.log(
               "User disconnected"
            );

         }
      );

   });

   return { server };

};