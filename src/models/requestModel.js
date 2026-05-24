import mongoose, { Schema } from "mongoose"

const ConnectionRequestSchema = new Schema({
    receiverId:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },
    senderId:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },
    status:{
        type:String,
        enum: ["pending","accepted","rejected"],
        default:"pending"
    }
},{timestamps:true})

export const ConnectionRequest = mongoose.model("ConnectionRequest",ConnectionRequestSchema)