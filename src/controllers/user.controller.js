import {asyncHandler} from "../utils/asynchandler.js" 
import {APIerror} from "../utils/APIerror.js"
import {User} from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js" 
import { APIresponse } from "../utils/APIresponse.js"
import mongoose from "mongoose"

const generateAccessAndRefreshTokens = async(userId)=>{
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave:false}) 
        return {accessToken,refreshToken};
    } catch (error) {
        throw new APIerror(500,"something went wrong while generating the refresh and access Token")
    } 
}

const registerUser=asyncHandler(async (req,res)=>{
   
 
    const {fullName,email,username,password}=req.body
    
    if(
        [fullName,email,username,password].some((field)=>{
            return field?.trim()==="" 
        }) 
    ){
        throw new APIerror(400,"all fields are required")
    }
   
    const existedUser= await User.findOne({
        $or:[{email},{username}]
    })
    if(existedUser) throw new APIerror(409,"username is already exist")
   const avatarLocalPath = req.files?.avatar[0]?.path 
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
        coverImageLocalPath=req.files.coverImage[0].path;
    }


    if(!avatarLocalPath){
        throw new APIerror(400, " avatar is required to proceed ")

    }
   const avatar = await uploadOnCloudinary(avatarLocalPath) 
   const coverImage = await uploadOnCloudinary(coverImageLocalPath) 
   if(!avatar)  throw new APIerror(400, " avatar is required to proceed ")

   const user = await User.create({
        fullName,
        avatar:avatar.url,
        coverImage:coverImage?.url || "", 
        email,
        password,
        username:username.toLowerCase() 
    })  


    const createdUser= await User.findById(user._id).select(
        "-password -refreshToken" 
    )

   
    if(!createdUser){
        throw new APIerror(500,"something went wrong while registering a user")
    }
 
    return res.status(201).json(
        new APIresponse(200,createdUser,"User registered successfully")
    )

})

const loginUser=asyncHandler(async (req,res)=>{
    
   
   const {email,username,password}=req.body
  
   if(!(username || email)) {throw new APIerror(400,"username or email is required");}
   
  const user = await User.findOne({
    $or:[{email},{username}] 
   })
   if(!user) throw new APIerror(404,"user does not exist");
   const isPasswordValid = await user.isPasswordCorrect(password);
   if(!isPasswordValid) { throw new APIerror(404,"Invalid user credentials")}
   const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id);
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken"); 
    const options = {
        httpOnly:true,
        secure:true,  
    }
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new APIresponse(
            200,
            {
                user:loggedInUser,accessToken,refreshToken
            }, 
            "user logged in Successfully"
        )
    ) 
 })
 

 const logoutUser = asyncHandler(async (req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },{
            new:true
        }
    )

    const options={
        httpOnly:true,
        secure:true
    }
    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new APIresponse(200,{},"User logged out"));
 })

const refreshAccessToken = asyncHandler(async (req,res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken // second condition is for mobile user
    if(!incomingRefreshToken){
        throw new APIerror(401,"unauthorized request from user")
    }

   
    try {
        const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decodedToken?._id);
        if(!user) throw new APIerror(401,"invalid refresh Token");
        if(incomingRefreshToken!==user?.refreshToken) throw new APIerror(401,"refreshToken is expired or used");
        const options = {
            httpOnly:true,
            secure:true
        }
      const {accessToken, newrefreshToken} = await generateAccessAndRefreshTokens(user._id);
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newrefreshToken,options)
        .json(
            new APIresponse(200,{
                accessToken,refreshToken:newrefreshToken},"access token refreshed"
            )
        )
    } catch (error) {
        throw new APIerror(401,error?.message || "invalid refresh Token")
    }
})

const changeCurrentPassword = asyncHandler(async (req,res)=>{
    const {oldPassword,newPassword} = req.body
    const user = await User.findById(req.user?._id);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
    if(!isPasswordCorrect) throw new APIerror(400,"Invalid old password");
    user.password = newPassword;
    await user.save({validateBeforeSave:false})
    return res.status(200).json(new APIresponse(200,{},"Password changed successfully"))
})

const getCurrentUser = asyncHandler(async (req,res)=>{
    return res.status(200).json(new APIresponse(200,req.user,"current user fetched successfully"))
})

const updateAccountDetails = asyncHandler(async (req,res)=>{
    const {fullName,email,} = req.body
    if(!fullName || !email){
        throw new APIerror(400,"all fields are required")
    }

    const user = User.findByIdAndUpdate(req.user?._id,
        {
            $set:{
                fullName,
                email:email
            }
        },
        {new:true} 
    ).select("-password")

    return res
    .status(200)
    .json(new APIresponse(200,user,"account details updated successfully"))
})

const updateUserAvatar = asyncHandler( async (req,res)=>{
    const avatarLocalPath = req.file?.path
    if(!avatarLocalPath) throw new APIerror(400,"avatar file is missig");
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if(!avatar.url) throw new APIerror(400,"error while uploading on avatar")
   const user =  await User.findByIdAndUpdate(req.user?._id,
        {$set:{
            avatar:avatar.url
        }},
        {new:true}).select("-password")
        return res.status(200).json(new APIresponse(200,{user},"avatar is updated successfully"))
})

const updateUserCoverImage = asyncHandler( async (req,res)=>{
    const coverImageLocalPath = req.file?.path
    if(!coverImageLocalPath) throw new APIerror(400,"cover file is missig");
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if(!coverImage.url) throw new APIerror(400,"error while uploading on coverImage")
    const user = await User.findByIdAndUpdate(req.user?._id,
        {$set:{
            coverImage:coverImage.url
        }},
        {new:true}).select("-password")
        return res.status(200).json(new APIresponse(200,{user},"coverImage is updated successfully"))

})


const getUserChannelProfile = asyncHandler(async (req,res)=>{
    const { username } = req.params 
    if(!username?.trim()) {
        throw new APIerror(400,"username is missing ")
    }
   const channel =  await User.aggregate([ 
        {
            $match:{
                username:username?.toLowerCase()
            }  
        },
        {
            $lookup:{ 
                from:"subscriptions",  
                localField:"_id",
                foreignField:"channel", 
                as:"subscribers"
            }
        },
        
        {
             $lookup:{
                from:"subscriptions",  
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo" 
            }
        },
        
        {
            $addFields:{ 
                subscribersCount:{ 
                    $size:"$subscribers"
                },
                channelsSubscribedToCount:{
                    $size:"$subscribedTo" 
                },
                isSubscribed:{
                    $cond:{
                        if:{ $in:[req.user?._id,"$subscribers.subscriber"] } ,
                        then:true,
                        else:false
                    }
                }
            }
        },{ 
            $project:{
                fullName:1,
                username:1,
                channelsSubscribedToCount:1,
                avatar:1,
                coverImage:1,
                isSubscribed:1,
                email:1
            }
        }
    ])  
    if(!channel?.length){
        throw new APIerror(404,"channel does not exist")
    }
    return res.status(200)
    .json(
        new APIresponse(200,channel[0],"user channel fetched successfully")
    )

})


const getWatchHistroy = asyncHandler(async (req,res)=>{
    const user = await User.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(req.user._id) 
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory", 
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner" , 
                            pipeline:[
                                {
                                    $project:{
                                        fullName:1,
                                        username:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first:"$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])
    return res.status(200).json(
        new APIresponse(200,user[0].getWatchHistoryy,"watch history fetched successfully")
    )
})

export {registerUser,loginUser,logoutUser,refreshAccessToken,
    changeCurrentPassword,getCurrentUser,
updateAccountDetails,updateUserAvatar,updateUserCoverImage,
getUserChannelProfile,getWatchHistroy}