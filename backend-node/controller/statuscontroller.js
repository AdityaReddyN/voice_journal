import { redis } from "../utils/redis.js";

export const checkStatus = async (req, res) => {
    const jobId = req.params.id;
    console.log(`Checking status for job: ${jobId}`);

    try {
        const data = await redis.hgetall(jobId);
        console.log(`Redis data for ${jobId}:`, data);

        if (!data || Object.keys(data).length === 0) {
            console.log(`No data found for job: ${jobId}`);
            return res.status(404).json({ status: "not_found" });
        }

        return res.json({
            job_id: jobId,
            status: data.status,
            progress: Number(data.progress || 0),
            transcript: data.transcript || null,
            provider: data.provider || null,
            error: data.error || null
        });

    } catch (err) {
        console.error("Redis error:", err);
        return res.status(500).json({ status: "error", message: err.message });
    }
};