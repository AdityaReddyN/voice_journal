import express from "express";
import { audioUpload } from "../middleware/uploadmiddleware.js";
import { handleAudioUpload } from "../controller/uploadcontroller.js";

const router = express.Router();

router.post("/upload", audioUpload, handleAudioUpload);

export default router;
