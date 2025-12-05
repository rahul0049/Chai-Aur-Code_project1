import mongoose, { mongo } from "mongoose"
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const videoSchema=new mongoose.Schema({
    //id is already created by mongoose so no need for that 
    videoFile:{
        type:String, //from cloudinary
        required:true,
    },
    thumbnail:{
        type:String,
        required:true,
    },
    description:{
        type:String,
        required:true,
    },
    duration:{
        type:Number, // it is also given by cloudinary (as it also send time of video)
        required:true,
    },
    views:{
        type:Number,
        default:0,
    },
    isPublished:{
        type:Boolean,
        default:true,
    },
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }
},{timestamps:true})

videoSchema.plugin(mongooseAggregatePaginate) // mainly for watch history
export const Video = mongoose.model("Video",videoSchema);