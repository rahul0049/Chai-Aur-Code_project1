import {asyncHandler} from "../utils/asynchandler.js" 
import {APIerror} from "../utils/APIerror.js"
import {User} from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js" // {} is used because defalut export is not used
import { APIresponse } from "../utils/APIresponse.js"
import mongoose from "mongoose"

const generateAccessAndRefreshTokens = async(userId)=>{
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        //store refresh token in DB
        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave:false}) // in Mongoose, don't validation 
        return {accessToken,refreshToken};
    } catch (error) {
        throw new APIerror(500,"something went wrong while generating the refresh and access Token")
    } 
}

const registerUser=asyncHandler(async (req,res)=>{
    //get user details from frontend / postman according to models
    //validation(check correct format of names, email,etc)-> not empty ?
    //check if user already exists? username,email
    //check for images then check for avatar
    //upload them to cloudinary, avatar
    //create user object ->entry in DB
    //remove password and refreshToken from response
    //check for user creation
    //if created return response or else throw error
 
    const {fullName,email,username,password}=req.body
    // console.log(email)

    //now perform validation 
    // if(fullName===""){
    //     throw new APIerror(400,"fullName is required")
    // } we need to write too many if
    if(
        [fullName,email,username,password].some((field)=>{
            return field?.trim()==="" // if field available them trim it and after trim if it is empty then return false 
        }) // it will check all fields 
    ){
        throw new APIerror(400,"all fields are required")
    }


    // now check if user exist or not . For this import user. Use {user} because export default is not used in user
    const existedUser= await User.findOne({
        $or:[{email},{username}]
    })
    if(existedUser) throw new APIerror(409,"username is already exist")

    //check for images 
    //we get req.data in body
    // middleware multer gives req.files
   const avatarLocalPath = req.files?.avatar[0]?.path //if files exist then in avatar take first property as it gives object

    //similarly take for cover image
    // const coverImageLocalPath = req.files?.coverImage[0]?.path 
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
        coverImageLocalPath=req.files.coverImage[0].path;
    }



    //avatar is compulsory
    if(!avatarLocalPath){
        throw new APIerror(400, " avatar is required to proceed ")

    }
    //now upload them to cloudinary
   const avatar = await uploadOnCloudinary(avatarLocalPath) // as it takes time to upload so use async await
   const coverImage = await uploadOnCloudinary(coverImageLocalPath) // it returns response


   //check for avatar 
   if(!avatar)  throw new APIerror(400, " avatar is required to proceed ")

    //create user object and send them to db, as user is talking to db
   const user = await User.create({
        fullName,
        avatar:avatar.url,
        coverImage:coverImage?.url || "", //if avaliable if not then ""
        email,
        password,
        username:username.toLowerCase() 
    })  

    //mongoDB creates a _id with every data
    const createdUser= await User.findById(user._id).select(
        "-password -refreshToken" // -password space -refreshToken then these two fields will not be selected
    
    )

    //checking if user is created
    if(!createdUser){
        throw new APIerror(500,"something went wrong while registering a user")
    }
    
    //now send response if created using API response 
    return res.status(201).json(
        new APIresponse(200,createdUser,"User registered successfully")
    )

})

const loginUser=asyncHandler(async (req,res)=>{
    // todos for login->
    /* get user details from req.body 
    username or email
    find the user
    password check 
    if correct password then generate access and refreshToken and give to user
    send in cookies 
    send response that user logged in 
    */
   const {email,username,password}=req.body
   //now we want atleast one of email or username
   if(!(username || email)) {throw new APIerror(400,"username or email is required");}
   //now check for username or email in db
  const user = await User.findOne({
    $or:[{email},{username}] // we can pass object in array. here $or is methods of mongoose
   })
   if(!user) throw new APIerror(404,"user does not exist");

   //now check for password. we need to check for user not User (because User method is of mongoose)
   const isPasswordValid = await user.isPasswordCorrect(password);
   if(!isPasswordValid) { throw new APIerror(404,"Invalid user credentials")}

   //now access and refresh token it is very common so use it as method
   const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id);

   //may be user is empty
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken"); // password and refreshToken is not added here 

    //now send them in cookies
    const options = {
        httpOnly:true,
        secure:true,  // now these cookies can only be modified by server only 
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
            }, // this is data from APIresponse.js
            "user logged in Successfully"
        )
    ) // json is used when user want access and refreshToken 
 })
 //logout user
 const logoutUser = asyncHandler(async (req,res)=>{
    //clear it's cookies
    //reset it's refreshToken
    //we want username 
    //so middleware is used to get it 
    //now we have access to user
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }// this set is method of mongoose 
        },{
            new:true
        }
    )
    //now clear cookies
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
    //take refresh token from cookies
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken // second condition is for mobile user
    if(!incomingRefreshToken){
        throw new APIerror(401,"unauthorized request from user")
    }

    //now verify the token
    try {
        const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET);
        //take info from db
        const user = await User.findById(decodedToken?._id);
        if(!user) throw new APIerror(401,"invalid refresh Token");
        if(incomingRefreshToken!==user?.refreshToken) throw new APIerror(401,"refreshToken is expired or used");
        //now generate the new tokesn
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
    //find user using req.user
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
        {new:true} //we get updated details  
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
    const username = req.params // where params is from url
    if(!username?.trim()) {
        throw new APIerror(400,"username is missing ")
    }
    // if we reached here then username exist because apierror is not thrown
    // User.find({username}) // this is one way. other way is match
   const channel =  await User.aggregate([ // it gives an array with {} are pipelines
        {
            $match:{
                username:username?.toLowerCase()
            }  
        },
        {
            $lookup:{ //used to join two documents
                from:"subscriptions",  // because in models all fields convert into lowecase and plural.. from means from where i need to join the document(which document to join)
                localField:"_id",//the name is our own document
                foreignField:"channel", // name is subscriptions document
                as:"subscribers" // now we get array of subscribers
            }
        },
        //in the next pipelines we find the numbers of channels that I subscribe 
        {
             $lookup:{
                from:"subscriptions",  // because in models all fields convert into lowecase and plural
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"  // the channels that i subscribed
            }// here we get all documents of subscriberTo now add it's size to the user 
        },
        //now we add additional fields
        {
            $addFields:{ // it add new fields like in classroom we have first name and last name . we add both and it give fullName . Now fullName is not in db we get by $addFields
                subscribersCount:{ // now new fields subscribersCount in added
                    // count the subscribers field
                    $size:"$subscribers"
                },
                channelsSubscribedToCount:{
                    $size:"$subscribedTo" // it gives the size of subscribedTo
                },
                isSubscribed:{
                    $cond:{//we want to see when I'm present in subscribers document
                        if:{ $in:[req.user?._id,"$subscribers.subscriber"] } ,// in check whether id present in subscribers or not 
                        // check user id (because we are logged in ) 
                        then:true,
                        else:false
                    }
                }
            }
        },{ // suppose we want to give selected values then user project and keep the name flag as 1
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
    //in mongoDB we get id object in string form . As we are using mongoose it convert ._id to mongoDB id .
    // in aggregation direct mongodb operations are there not mongoose
    const user = await User.aggregate([
        {
            $match:{ // here we have to form object id of mongoose
                _id:new mongoose.Types.ObjectId(req.user._id) 
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory", // now we need to add more pipeline in it because videos also contains a user
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner" , // now in owner document we get all details of user but we don't watch that much
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
                    },// frontend get owner which contains array in that array the first position contains data(usrname,fullname,avatar)
                    //we can use another pipeline to get first value 
                    {
                        $addFields:{
                            owner:{
                                $first:"owner"
                            }// now he get direct values 
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