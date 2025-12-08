import multer from "multer"

const storage=multer.diskStorage({
    destination:function(req,file,cb){
        cb(null, "./public/temp")
    },
    filename:function(req,file,cb){
        
        cb(null,file.originalname)
    }
})
// it is multer.diskStorage({destination:function},{filename:function})
export const upload = multer({
    storage:storage})