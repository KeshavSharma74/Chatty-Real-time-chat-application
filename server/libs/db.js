import mongoose from "mongoose"
import "dotenv/config"

let demochetan;
const connectDb = async()=>{
    try{
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${process.env.DB_NAME}`);
        demochetan=connectionInstance;
        for(let i=0;i<10;i++){
            console.log("Database Connected Successfully.");
        }
        console.log("Host :",connectionInstance.connection.host);

    }
    catch(error){
        console.log("Database Connection Failed.")
        console.log(error.message);
        process.exit(1);
    }
}

export {connectDb,demochetan};