import { Router } from "express";
import { verifyJWT } from "../middlewares/authMiddlewar.js";
import { acceptRequest, cancelRequest, getAcceptedUsers, incomingRequest, rejectRequest, removeFriend, sendRequest, sentRequests } from "../controllers/requestController.js";

const router = Router()

router.route("/send/:id").post(verifyJWT,sendRequest)
router.route("/incoming").get(verifyJWT,incomingRequest)
router.route("/accept/:id").put(verifyJWT,acceptRequest)
router.route("/reject/:id").put(verifyJWT,rejectRequest)
router.route("/connections").get(verifyJWT,getAcceptedUsers)
router.get(
   "/sent",
   verifyJWT,
   sentRequests
)
router.delete(
    "/cancel/:id",
    verifyJWT,
    cancelRequest
);

router.delete(
   "/remove-friend/:id",
   verifyJWT,
   removeFriend
);

export default router