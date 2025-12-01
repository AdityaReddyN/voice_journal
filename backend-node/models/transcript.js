// backend-node/models/transcript.js
import mongoose from "mongoose";

const transcriptSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    jobId: {
        type: String,
        required: true,
        unique: true
    },
    filename: String,
    transcript: {
        type: String,
        required: true
    },
    provider: String,
    duration: Number,
    fileSize: Number,
    status: {
        type: String,
        enum: ['processing', 'completed', 'failed'],
        default: 'processing'
    }
}, { timestamps: true });

export default mongoose.model("Transcript", transcriptSchema);