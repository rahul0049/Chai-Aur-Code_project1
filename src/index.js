import mongoose from "mongoose"
import {DB_NAME} from "./constants.js"
import dotenv from "dotenv"
// require("dotevn").config() // it is used so that as soon as application the env variables available everywhere (each file )
dotenv.config({path:'./env'}) // for this update dev in scripts in package.json

// import express from "express"
// const app=express();
import connectDB from "./db/index.js"
connectDB()

// using efi-> immediately run, ; is used so that if in last line before that function if it is not used then no error
// approach 1st to connect db
/*
;(async ()=>{
    try{ 
       await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
       app.on("error",(error)=>{
        console.log("DB connected but app is not able to communicate with db");
        throw error
       })
       app.listen(process.env.PORT,()=>{
        console.log(`App is listening on port ${process.env.PORT}`)
       })
    }
    catch(error){
        console.log("Error:" , error)
        throw error;
    }

})() */;