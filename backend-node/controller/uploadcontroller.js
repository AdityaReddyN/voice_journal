import { v4 as uuid } from "uuid";
import { redis } from "../utils/redis.js";

export const handleAudioUpload=async (req,res)=>{
    try{
        if(!req.file){
            return res.status(400).json({error:"No audio file"});
        }

        const jobID = uuid();
        const filePath = req.file.path;
    
        await redis.lpush(
            "voicejnl_queue",
            JSON.stringify({jobID,filePath})
        );
        res.json({message:"Uploaded file and added to queue",jobID});

    }
    catch(error){
        return res.status(500).json({message:"error in uploading",error});
    }
};