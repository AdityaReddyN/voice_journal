// backend-node/routes/transcriptroutes.js
import express from "express";
import { getUserTranscripts, getTranscriptById, deleteTranscript } from "../controller/transcriptcontroller.js";
import { auth } from "../middleware/authmiddleware.js";

const router = express.Router();

router.get("/", auth, getUserTranscripts);
router.get("/:id", auth, getTranscriptById);
router.delete("/:id", auth, deleteTranscript);

export default router;