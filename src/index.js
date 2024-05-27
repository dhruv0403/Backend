import mongoose, { connect } from "mongoose";
import express from "express";
import connectDB from "./db/index.js";
import dotenv from "dotenv"
const app=express()

dotenv.config({
    path: './env'
})

connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`App is listening on port ${process.env.PORT}`);
    })
})
.catch((error)=>{
    console.log("Mongo db connection failed !!!",error);
})









// const app=express()

// ( async ()=>{
//     try {
//         mongoose.connect(`${process.env.MONDB_URI}/${DB_NAME}`)
//         app.on("error",(error)=>{
//             console.lor("ERR:",error)
//             throw error
//         })
//         app.listen(process.env.PORT,()=>{
//             console.log(`App is listening on port ${process.env.PORT}`);
//         })
//     } catch (error) {
//         console.error("Error:",error);
//         throw err
//     }
// })()