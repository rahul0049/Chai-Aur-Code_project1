import { APIresponse } from "../utils/APIresponse"
import { asyncHandler } from "../utils/asynchandler"
const healthCheck = asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(
        new ApiResponse(200 , "Everything is working")
    )
})

export {healthCheck}