import {v2 as cloudinary} from "cloudinary"
import fs from "fs"

cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
    });

const uploadOnCloudinary=async (localFilePath)=>{
    try {
        if(!localFilePath) return null
        //upload the file on cloudinary
      const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })
        //now file has been uploaded successfully . 
         console.log("successfully uploaded the file on cloudinary")
        // fs.unlink(localFilePath);
        console.log(response.url); // public url
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the locally saved temp file as the upload operation gets failed
        return null;
    }
}
export {uploadOnCloudinary};