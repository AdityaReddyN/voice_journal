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
        if (!req.file) {
            return res.status(400).json({ error: "No audio file" });
        }

        const jobID = uuid();
        const wslPath = convertToWSLPath(req.file.path);
        const userId = req.userId || "";
        
        // Initialize status in Redis
        await redis.hset(jobID, 
            "status", "queued",
            "progress", "0",
            "userId", userId,
            "filename", req.file.originalname
        );
        
        // Create Celery message with proper format
        const taskId = uuid();
        
        const taskMessage = [
            [jobID, wslPath],  // args
            {},                 // kwargs
            {                   // embed
                callbacks: null,
                errbacks: null,
                chain: null,
                chord: null
            }
        ];
        
        const celeryMessage = {
            body: Buffer.from(JSON.stringify(taskMessage)).toString('base64'),
            'content-encoding': 'utf-8',
            'content-type': 'application/json',
            headers: {
                lang: 'js',
                task: 'worker.process_audio',
                id: taskId,
                root_id: taskId,
                parent_id: null,
                group: null,
                meth: null,
                shadow: null,
                eta: null,
                expires: null,
                retries: 0,
                timelimit: [null, null],
                argsrepr: `('${jobID}', '${wslPath}')`,
                kwargsrepr: '{}',
                origin: 'gen1@nodejs'
            },
            properties: {
                correlation_id: taskId,
                reply_to: taskId,
                delivery_mode: 2,
                delivery_info: {
                    exchange: '',
                    routing_key: 'celery'
                },
                priority: 0,
                body_encoding: 'base64',
                delivery_tag: taskId
            }
        };

        // Push to Celery queue  
        await redis.lpush('celery', JSON.stringify(celeryMessage));
        
        console.log(`✅ Job ${jobID} queued for Celery with task ID: ${taskId}`);
        
        res.json({ message: "Uploaded file and added to queue", jobID });
    } catch (error) {
        console.error("❌ Upload error:", error);
        return res.status(500).json({ 
            message: "error in uploading", 
            error: error.message 
        });
    }
};