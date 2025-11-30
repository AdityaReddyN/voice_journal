import { useState, useRef } from "react";
import "./styles/Upload.css";

export default function Upload() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  const [uploading, setUploading] = useState(false);
  const [jobId, setJobId] = useState("");
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");

  // Recording refs
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedURL, setRecordedURL] = useState("");

  // ================================
  // File Upload
  // ================================
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setStatus("");
    setTranscript("");
    setRecordedURL("");
  };

  // ================================
  // Recording functions
  // ================================
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setRecordedURL(url);

        const recordedFile = new File([blob], "recording.webm", {
          type: "audio/webm"
        });

        setFile(recordedFile);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setStatus("Recording...");
    } catch (err) {
      setStatus("Mic access denied");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setIsRecording(false);
    setStatus("Recording stopped. Ready to upload.");
  };

  // ================================
  // Upload + Polling
  // ================================
  const handleUpload = async () => {
    if (!file) {
      setStatus("Please select or record an audio file.");
      return;
    }

    const formData = new FormData();
    formData.append("audio", file);

    try {
      setUploading(true);
      setStatus("Uploading...");

      const res = await fetch("http://localhost:3000/api/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = await res.json();

      if (!data.jobID) {
        setStatus("Upload failed.");
        setUploading(false);
        return;
      }

      setJobId(data.jobID);
      setStatus("Processing...");
      pollStatus(data.jobID);

    } catch (err) {
      setUploading(false);
      setStatus("Upload failed.");
    }
  };

  const pollStatus = (jobID) => {
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/status/${jobID}`);
        const data = await res.json();

        if (data.status === "pending") return;

        if (data.status === "success") {
          setTranscript(data.transcript);
          setStatus("Transcription complete.");
          clearInterval(timer);
        }

        if (data.status === "error") {
          setError(data.message);
          setStatus("Error processing audio.");
          clearInterval(timer);
        }
      } catch {
        clearInterval(timer);
        setStatus("Error checking status.");
      }
    }, 2000);
  };

  return (
    <div className="upload-container">
      <h1 className="upload-title">Voice Journal Upload</h1>

      {/* Recording section */}
      <div className="record-section">
        {!isRecording ? (
          <button className="upload-btn" onClick={startRecording}>
            🎤 Start Recording
          </button>
        ) : (
          <button className="upload-btn stop" onClick={stopRecording}>
            ⏹ Stop Recording
          </button>
        )}
      </div>

      {/* Playback recorded audio */}
      {recordedURL && (
        <audio controls src={recordedURL} style={{ marginTop: "10px" }} />
      )}

      {/* File upload box */}
      <label className="upload-box">
        <input
          type="file"
          accept="audio/*"
          onChange={handleFileChange}
          className="file-input"
        />

        <div className="upload-text">
          <p>Click to select an audio file</p>
          <span>(MP3, WAV, M4A, WEBM)</span>
        </div>
      </label>

      {file && <p className="file-name">Selected: {file.name}</p>}

      <button
        className="upload-btn"
        onClick={handleUpload}
        disabled={uploading}
      >
        {uploading ? "Uploading..." : "Upload"}
      </button>

      {status && <p className="status-text">{status}</p>}
      {error && <p className="status-text error">{error}</p>}

      {/* Transcript */}
      {transcript && (
        <div className="transcript-box">
          <h3>Transcript</h3>
          <p>{transcript}</p>
        </div>
      )}
    </div>
  );
}
