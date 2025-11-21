import { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

export default function UploadApp() {
  const [file, setFile] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [status, setStatus] = useState(null);
  const [transcript, setTranscript] = useState(null);
  const [loading, setLoading] = useState(false);

  const logoutUser = () => {
    localStorage.removeItem("token");
    window.location.reload();
  };

  useEffect(() => {
    if (!jobId) return;

    const interval = setInterval(async () => {
      const res = await axios.get(`http://localhost:3000/api/status/${jobId}`);
      setStatus(res.data.status);

      if (res.data.status === "completed") {
        clearInterval(interval);
        fetchTranscript();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [jobId]);

  const fetchTranscript = async () => {
    const res = await axios.get(`http://localhost:3000/api/result/${jobId}`);
    setTranscript(res.data.transcript);
  };

  const uploadAudio = async () => {
    if (!file) return alert("Select an audio file first!");

    setLoading(true);

    const formData = new FormData();
    formData.append("audio", file);

    // send JWT token
    const token = localStorage.getItem("token");

    const res = await axios.post("http://localhost:3000/api/upload", formData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    setJobId(res.data.jobId);
    setStatus("queued");

    setLoading(false);
  };

  return (
    <div className="container">
      <button onClick={logoutUser} style={{ float: "right" }}>
        Logout
      </button>

      <h1>Voice Journal</h1>

      {!jobId && (
        <>
          <label className="upload-box">
            <input
              type="file"
              accept="audio/*"
              hidden
              onChange={(e) => setFile(e.target.files[0])}
            />
            {file ? file.name : "Click to select audio file"}
          </label>

          <button onClick={uploadAudio}>
            {loading ? "Uploading..." : "Upload Audio"}
          </button>
        </>
      )}

      {jobId && (
        <div className="status-box">
          <strong>Job ID:</strong> {jobId} <br />
          <strong>Status:</strong> {status}
        </div>
      )}

      {transcript && (
        <div className="transcript-box">
          <h3>Transcript</h3>
          <p>{transcript}</p>
        </div>
      )}
    </div>
  );
}
