import { redis } from "../utils/redis.js";


export const checkStatus = async (req, res) => {
  try {
    const jobId = req.params.id;

    console.log("Status check for job:", jobId);

    const data = await redis.get(jobId);

    if (!data) {
      return res.json({ status: "pending" });
    }

    return res.json(JSON.parse(data));
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};
