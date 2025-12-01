// backend-node/controller/transcriptcontroller.js
import Transcript from "../models/transcript.js";

export const getUserTranscripts = async (req, res) => {
    try {
        const transcripts = await Transcript.find({ userId: req.userId })
            .sort({ createdAt: -1 })
            .limit(50);
        
        res.json({ transcripts });
    } catch (error) {
        res.status(500).json({ message: "Error fetching transcripts", error: error.message });
    }
};

export const getTranscriptById = async (req, res) => {
    try {
        const transcript = await Transcript.findOne({
            _id: req.params.id,
            userId: req.userId
        });
        
        if (!transcript) {
            return res.status(404).json({ message: "Transcript not found" });
        }
        
        res.json({ transcript });
    } catch (error) {
        res.status(500).json({ message: "Error fetching transcript", error: error.message });
    }
};

export const deleteTranscript = async (req, res) => {
    try {
        const result = await Transcript.deleteOne({
            _id: req.params.id,
            userId: req.userId
        });
        
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "Transcript not found" });
        }
        
        res.json({ message: "Transcript deleted" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting transcript", error: error.message });
    }
};