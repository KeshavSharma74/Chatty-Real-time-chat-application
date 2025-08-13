import mongoose from "mongoose"
import "dotenv/config"

const connectDb = async()=>{
    try{
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${process.env.DB_NAME}?retryWrites=true&w=majority`);
        console.log("Database Connected Successfully.");
        console.log("Host :",connectionInstance.connection.host);
    }
    catch(error){
        console.log("Database Connection Failed.")
        console.log(error.message);
        process.exit();
    }
}

export default connectDb;