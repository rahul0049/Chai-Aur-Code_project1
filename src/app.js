import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
const app = express()

//configure cors and cookieParse after app
app.use(cors({
    origin: ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:5500", "*"],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
})) 

app.use(express.json({limit:"16kb"})) // accept json file before that body parser and multer used
app.use(express.urlencoded({extended:true})) // extended-> object ke ander object encoded (like space is %20)
app.use(express.static("public")) // public is folder which is used to store images and videos 

// cookies is used access cookies from browser of user using server and set his cookies 
// secure cookies can be put in brower of user which can be read and removed by server only
app.use(cookieParser())




/*
variours req can be called -> two most important are req.params(for url) and req.body(in forms of json,form)
from cookies
*/




//routes
import userRouter from "./routes/user.routes.js"

//routes declaration
//app.get() only when we are not using Router.
// here app.use middleware is used
app.use("/api/v1/users",userRouter) //activate userRouter i.e. if anyone write users the control goes to userRouter
//api / version1 then users then which route 
/*
Source - https://stackoverflow.com/a/64155257
Posted by Ibad Shaikh, modified by community. See post 'Timeline' for change history
Retrieved 2025-12-09, License - CC BY-SA 4.0
*/




export { app }