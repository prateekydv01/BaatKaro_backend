import { Router } from "express";
import { verifyJWT } from "../middlewares/authMiddlewar.js";
import { deleteMessage, getMessages, sendMessage } from "../controllers/messageController.js";

const router= Router()

router.route("/send/:id").post(verifyJWT,sendMessage)
router.route("/:id").get(verifyJWT,getMessages)
router.route("/message/:id").delete(
   verifyJWT,
   deleteMessage
);

export default router