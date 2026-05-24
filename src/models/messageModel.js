import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    text: {
      type: String,
      trim: true,
      required: true,
    },

    seen: {
      type: Boolean,
      default: false,
    },

  },
  {
    timestamps: true,
  }
);

export const Message =
  mongoose.model(
    "Message",
    MessageSchema
  );