import { request } from "express"

const asyncHandler =(requestHandler)=>{
   return (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next)).catch((err)=> next(err))
    }
} // this is promise method 
export {asyncHandler}


// const asyncHandler=()=>{}
// const asyncHandler=(fun)=>{async()=>{}}
//it is also written as 

//the try catch method is 
// const asynchandler=(fn)=> async (req,res,next)=>{
//     try {
//         await fn(req,res,next)
//     } catch (error) {
//         res.status(error.code || 500).json({ // json is used to convert in json 
//             success:false,
//             message:error.message
//         })
//     }

// }