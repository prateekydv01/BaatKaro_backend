import http from "http"
import { Server } from "socket.io"

//stores userid and socket id 
export const onlineUsers = new Map()

export let io
//exported io so that controllers can use

export const initializeSocket = (app) => {

    const server = http.createServer(app)
    //Creates HTTP server from Express app. socket IO works on HTTP Server

    io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL,
            credentials: true
        }
    })

    //Create socket IO server


    //Runs whenever new user connects.
    //Each user will get new socket
    io.on("connection", (socket) => {

        const userId = socket.handshake.query.userId
        //Gets userId sent from frontend.

        if (userId) {
            onlineUsers.set(userId, socket.id)
            //maps the userId and socketId in map
        }


        console.log("User connected:", socket.id)

       //Sends all online users to EVERY connected client.
        io.emit(
            "online-users",
            Array.from(onlineUsers.keys())
        )
       
        //Runs when user:
          // closes tab
          // refreshes
          // loses internet

        socket.on("disconnect", () => {

            onlineUsers.forEach((value, key) => {
                //Removes disconnected user from online list.
                if (value === socket.id) {
                    onlineUsers.delete(key)
                }
            })


            io.emit(
                "online-users",
                Array.from(onlineUsers.keys())
            )

            console.log("User disconnected")
        })
    })

    return {server}
}