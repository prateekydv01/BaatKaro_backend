import express from "express"
import cors from "cors"
import connectDB from "../db/index.js"
import dotenv from "dotenv"
import cookieParser from "cookie-parser"
import { initializeSocket } from "./socket.js"


dotenv.config()


const app = express()
const {server} = initializeSocket(app)

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true 
}))

import userRouter from "./routers/userRouter.js"
import requestRouter from "./routers/requestRouter.js"
import messageRouter from "./routers/messageRouter.js"

app.use("/api/v1/user", userRouter)
app.use("/api/v1/request",requestRouter)
app.use("/api/v1/chat",messageRouter)

const PORT = process.env.PORT || 4000


connectDB()
  .then(() => {

    server.listen(PORT, () => {

      console.log(`Server running on port ${PORT}`)

    })

  })
  .catch((error) => {

    console.log("MongoDB connection failed", error)

  })

  export { app }