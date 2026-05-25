import { Router } from "express";
import { getCurrentUser, loginUser,registerUser,logoutUser, searchUser, getUserProfile } from "../controllers/userController.js";
import { verifyJWT } from "../middlewares/authMiddlewar.js";

const router = Router()

router.route("/login").post(loginUser)
router.route("/register").post(registerUser)    
router.route("/current-user").get(verifyJWT,getCurrentUser)
router.route("/logout").post(verifyJWT,logoutUser)
router.route("/search").get(verifyJWT,searchUser)
router.get("/profile/:id",verifyJWT,getUserProfile);


export default router   