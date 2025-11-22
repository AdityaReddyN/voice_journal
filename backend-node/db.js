import mongoose from "mongoose"

const connectDB = async () =>{
    try {
        mongoose.connect("mongodb://127.0.0.1:27017/voiceJournalDB");
        console.log("Connect to MongoDB");
    } catch (error) {
        console.log("DID NOT Connect to MONGO: ",error);
    }
};

export default connectDB;