import { APIerror } from "../utils/APIerror.js";
import { asyncHandler } from "../utils/asynchandler.js";
import { User } from "../models/user.models.js";
import jwt from "jsonwebtoken";


export const verifyJWT = asyncHandler(async (req,res,next)=>{
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ",""); // we get token
        if (!token) throw new APIerror(401, "Unauthorized request");

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
        if (!user) {

            throw new APIerror(401, "Invalid access Token");
        }

        req.user = user;
        next();
    } catch (error) {
        throw new APIerror(401,error?.message || "invalid accessToken")
    }

    
})