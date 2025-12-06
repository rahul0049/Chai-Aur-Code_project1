import { Router } from "express";
import { registerUser } from "../controllers/user.controller";

const router=Router()

router.route("/register").post(registerUser)
//now url become http://localhost:8000/users/register

export default router