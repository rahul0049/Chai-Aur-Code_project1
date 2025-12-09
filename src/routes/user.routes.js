import { Router } from "express";
import { logoutUser, refreshAccessToken, registerUser } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
const router=Router()
import { loginUser } from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

router.route("/register").post(
    upload.fields([
        { name: "avatar", maxCount: 1 },
        { name: "coverImage", maxCount: 1 }
    ]), // middleware is used for fs, just before method is executed
    registerUser)
//now url become http://localhost:8000/users/register


router.route("/login").post(loginUser)

//secured routes
router.route("/logout").post(verifyJWT,logoutUser)//here verifyJWT is a middleware and next() in middleware told to go to logoutUser
router.route("/refreshToken").post(refreshAccessToken)

export default router