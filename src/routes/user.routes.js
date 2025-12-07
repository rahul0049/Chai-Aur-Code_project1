import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
const router=Router()

router.route("/register").post(
    upload.fields({
        name:"avatar",
        maxCount:1
    },{
        name:"coverImage",
        maxCount:1

    }), // middlewre is used for fs,just before method is exected we 
    registerUser)
//now url become http://localhost:8000/users/register

export default router