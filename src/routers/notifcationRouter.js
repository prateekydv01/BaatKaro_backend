import { Router  } from "express";
import { verifyJWT } from "../middlewares/authMiddlewar.js";
import { deleteNotification, getNotifications, markAsRead } from "../controllers/notificationController.js";

const router= Router()

router.route("/").get(verifyJWT,getNotifications)
router.route("/:id").put(verifyJWT,markAsRead)
router.delete(
   "/:id",
   verifyJWT,
   deleteNotification
);

export default router