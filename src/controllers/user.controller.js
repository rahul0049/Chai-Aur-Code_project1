import {asyncHandler} from "../utils/asynchandler.js" 
import {APIerror} from "../utils/APIerror.js"
import {User} from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js" // {} is used because defalut export is not used
import { APIresponse } from "../utils/APIresponse.js"

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
    console.log(email)

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
export {registerUser}