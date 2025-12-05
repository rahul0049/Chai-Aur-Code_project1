import mongoose, { Schema } from "mongoose"
import jwt from "jsonwebtoken" // used for token 
import bcrypt from "bcrypt" // for encryption of password

//direct encryption is not possible so middlewares(hook) are used for it like Pre


const userSchema = new Schema({
    username:{
        type:String,
        reaquired:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true, // mainly for seraching in database 
    },
    email:{
        type:String,
        reaquired:true,
        unique:true,
        lowercase:true,
        trim:true,
         
    },
    fullname:{
        type:String,
        reaquired:true,
        trim:true,
        index:true,
    },
    avatar:{
        type:String, // cloudinary url
        required:true,


    },
    coverImage:{
        type:String,

    },
    watchHistory:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Video"
        }
    ],
    password:{
        type:String,
        reqruired:[true,'password is required']
    },
    refreshToken:{
        type:String,
    }
},{timestamps:true})





userSchema.pre("save",async function (next){
    if(!this.isModified("password")) return next();
    this.password = bcrypt.hash(this.password,10);
     next() // it creates a problem because if user change avatar then it is called and it changes password so use if condition

}) //types are save,update,remove,validate,deleteOne,updateOne,init
//arrow function is not used here because they don't have context (this)

userSchema.methods.isPasswordCorrect=async function(password){
    return await bcrypt.compare(password,this.password) // this.password is encrypted
}


userSchema.methods.generateAccessToken = function (){
   return jwt.sign({
        _id:this._id,
        email:this.email,
        username:this.username,
        fullname:this.fullname
            },//this is payload
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }

)// generate the token
        
}


userSchema.methods.generateRefreshToken = function(){
    return jwt.sign({
        _id:this._id    }, // as it keeps on refreshing so only store id
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }

)// generate the token
}


export const User=mongoose.model("User",userSchema)