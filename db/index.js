import mongoose from "mongoose"

const DB_NAME = "chatApp"

const connectDB = async()=>{
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGOB_URI}/${DB_NAME}`)
        console.log(`\n mongoDB connected ! DB host : ${connectionInstance.connection.host} `);
    } catch (error) {
        console.log("Mongo DB connection Error",error);
        process.exit(1)
    }
}

export default connectDB