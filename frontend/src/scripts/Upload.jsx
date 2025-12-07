import { useState, useRef, useEffect } from "react";
import "./styles/Upload.css";

export default function Upload() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  const [uploading, setUploading] = useState(false);
  const [jobId, setJobId] = useState("");
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);

  // Recording refs
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedURL, setRecordedURL] = useState("");
  const pollingTimerRef = useRef(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
      }
    };
  }, []);

  // ================================
  // File Upload
  // ================================
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setStatus("");
    setTranscript("");
    setRecordedURL("");
    setError("");
    setProgress(0);
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
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setStatus("🎙️ Recording...");
    } catch (err) {
      setStatus("❌ Mic access denied");
      setError("Please allow microphone access to record audio.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setStatus("✅ Recording stopped. Ready to upload.");
    }
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
      setStatus("📤 Uploading...");
      setError("");
      setProgress(10);

      const res = await fetch("http://127.0.0.1:3000/api/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = await res.json();

      if (!data.jobID) {
        setStatus("Upload failed.");
        setUploading(false);
        setProgress(0);
        return;
      }

      setJobId(data.jobID);
      setStatus("⚙️ Processing...");
      setProgress(25);
      pollStatus(data.jobID);

    } catch (err) {
      setUploading(false);
      setStatus("Upload failed.");
      setError(err.message);
      setProgress(0);
    }
  };

  const pollStatus = (jobID) => {
    // Clear any existing timer
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
    }

    pollingTimerRef.current = setInterval(async () => {
      try {
        const res = await fetch(`http://127.0.0.1:3000/api/status/${jobID}`);

        if (res.status === 404) {
          return;
        }

        const data = await res.json();

        // Update progress based on status
        if (data.status === "received") {
          setStatus("📥 Received...");
          setProgress(40);
          return;
        }

        if (data.status === "sending_to_stt") {
          setStatus("🎯 Transcribing...");
          setProgress(60);
          return;
        }

        if (data.status === "saving") {
          setStatus("💾 Saving...");
          setProgress(80);
          return;
        }

        if (data.status === "completed") {
          setTranscript(data.transcript);
          setStatus("✅ Transcription complete!");
          setProgress(100);
          setUploading(false);
          clearInterval(pollingTimerRef.current);
          return;
        }

        if (data.status === "failed") {
          setError(data.error || "Unknown error occurred");
          setStatus("❌ Error processing audio");
          setProgress(0);
          setUploading(false);
          clearInterval(pollingTimerRef.current);
          return;
        }

      } catch (err) {
        console.log("Polling error", err);
      }
    }, 2000);
  };

  const resetForm = () => {
    setFile(null);
    setStatus("");
    setTranscript("");
    setError("");
    setRecordedURL("");
    setProgress(0);
    setJobId("");
    setUploading(false);
  };

  return (
    <div className="upload-container">
      <h1 className="upload-title"> Voice Journal</h1>

      {/* Recording section */}
      <div className="record-section">
        {!isRecording ? (
          <button 
            className="record-btn" 
            onClick={startRecording}
            disabled={uploading}
          >
            🎤 Start Recording
          </button>
        ) : (
          <button className="record-btn stop" onClick={stopRecording}>
             Stop Recording
          </button>
        )}
      </div>

      {/* Playback recorded audio */}
      {recordedURL && (
        <div className="audio-preview">
          <audio controls src={recordedURL} />
        </div>
      )}

      {/* File upload box */}
      <label className={`upload-box ${uploading ? 'disabled' : ''}`}>
        <input
          type="file"
          accept="audio/*"
          onChange={handleFileChange}
          className="file-input"
          disabled={uploading}
        />

        <div className="upload-text">
          <p>Click to select an audio file</p>
          <span>(MP3, WAV, M4A, WEBM)</span>
        </div>
      </label>

      {file && <p className="file-name">Selected: {file.name}</p>}

      {/* Progress bar */}
      {progress > 0 && progress < 100 && (
        <div className="progress-container">
          <div className="progress-bar" style={{ width: `${progress}%` }}></div>
        </div>
      )}

      <button
        className="upload-btn"
        onClick={handleUpload}
        disabled={uploading || !file}
      >
        {uploading ? "Processing..." : "Upload & Transcribe"}
      </button>

      {status && <p className="status-text">{status}</p>}
      {error && <p className="error-text">⚠️ {error}</p>}

      {/* Transcript */}
      {transcript && (
        <div className="transcript-box">
          <h3>📝 Transcript</h3>
          <p>{transcript}</p>
          <button className="reset-btn" onClick={resetForm}>
            Upload Another
          </button>
        </div>
      )}
    </div>
  );
}