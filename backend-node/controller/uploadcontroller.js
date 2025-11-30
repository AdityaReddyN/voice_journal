import { v4 as uuid } from "uuid";
import { redis } from "../utils/redis.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function convertToWSLPath(windowsPath) {
    const absolutePath = path.resolve(windowsPath);
    let wslPath = absolutePath.replace(/\\/g, '/');
    wslPath = wslPath.replace(/^([A-Z]):/, (match, drive) => `/mnt/${drive.toLowerCase()}`);
    return wslPath;
}

export const handleAudioUpload = async (req, res) => {
    try {
        console.log("📤 Upload request received");
        
        if (!req.file) {
            return res.status(400).json({ error: "No audio file" });
        }

        const jobID = uuid();
        const wslPath = convertToWSLPath(req.file.path);
        
        console.log(`🆔 Generated job ID: ${jobID}`);
        console.log(`📁 Windows path: ${req.file.path}`);
        console.log(`📁 WSL path: ${wslPath}`);
        
        // Initialize job status in Redis
        await redis.hset(jobID, 
            "status", "queued",
            "progress", "0",
            "transcript", "",
            "provider", "",
            "error", ""
        );
        
        console.log(`✅ Job ${jobID} initialized in Redis`);
        
        // Create Celery v4 protocol message
        const headers = {
            lang: "js",
            task: "worker.process_audio",
            id: jobID,
            root_id: jobID,
            parent_id: null,
            group: null,
            meth: null,
            shadow: null,
            eta: null,
            expires: null,
            retries: 0,
            timelimit: [null, null],
            argsrepr: `('${jobID}', '${wslPath}')`,
            kwargsrepr: "{}",
            origin: "node@backend"
        };

        const body = [
            [jobID, wslPath],  // args
            {},                 // kwargs
            {                   // embed
                callbacks: null,
                errbacks: null,
                chain: null,
                chord: null
            }
        ];

        const message = [
            body,
            "application/json",
            "utf-8"
        ];

        const celeryMessage = {
            body: Buffer.from(JSON.stringify(body)).toString('base64'),
            "content-encoding": "utf-8",
            "content-type": "application/json",
            headers: headers,
            properties: {
                correlation_id: jobID,
                reply_to: jobID,
                delivery_mode: 2,
                delivery_info: {
                    exchange: "",
                    routing_key: "celery"
                },
                priority: 0,
                body_encoding: "base64",
                delivery_tag: jobID
            }
        };
        
        await redis.lpush("celery", JSON.stringify(celeryMessage));
        
        console.log(`📤 Celery task sent to queue`);
        
        res.json({ message: "Uploaded file and added to queue", jobID });

    } catch (error) {
        console.error("❌ Upload error:", error);
        console.error("Error stack:", error.stack);
        return res.status(500).json({ 
            message: "error in uploading", 
            error: error.message 
        });
    }
};