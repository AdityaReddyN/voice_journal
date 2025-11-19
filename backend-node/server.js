const express = require("express");
const multer = require("multer");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const redis = require("./queue");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// store uploaded audio
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({ storage });

// ------------------------------
//  POST /api/upload
// ------------------------------
app.post("/api/upload", upload.single("audio"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No audio file provided" });
  }

  const jobId = uuidv4();
  const audioPath = req.file.path;

  // send task to Redis queue
  await redis.rPush("stt_jobs", JSON.stringify({ jobId, audioPath }));

  // store initial status
  await redis.hSet(`job:${jobId}`, {
    status: "queued",
  });

  res.json({ jobId });
});

// ------------------------------
//  GET /api/status/:jobId
// ------------------------------
app.get("/api/status/:jobId", async (req, res) => {
  const jobId = req.params.jobId;

  const status = await redis.hGet(`job:${jobId}`, "status");
  res.json({ status });
});

// ------------------------------
//  GET /api/result/:jobId
// ------------------------------
app.get("/api/result/:jobId", async (req, res) => {
  const jobId = req.params.jobId;

  const transcript = await redis.hGet(`job:${jobId}`, "transcript");
  res.json({ transcript });
});

// ------------------------------
const PORT = 3000;
app.listen(PORT, () => console.log(`Backend running on port  http://localhost:${PORT}`));
