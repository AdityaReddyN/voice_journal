import { useState } from "react";
import "./styles/Upload.css";

export default function Upload() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setStatus("");
  };

  const handleUpload = async () => {
    if (!file) {
      setStatus("Please select an audio file.");
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
        credentials: "include"
      });

      const data = await res.json();
      setUploading(false);

      if (data.jobId) {
        setStatus(`Upload complete! Job ID: ${data.jobId}`);
      } else {
        setStatus("Upload failed.");
      }
    } catch (err) {
      setStatus("Error uploading file.");
      setUploading(false);
    }
  };

  return (
    <div className="upload-container">
      <h1 className="upload-title">Voice Journal Upload</h1>

      <label className="upload-box">
        <input
          type="file"
          accept="audio/*"
          onChange={handleFileChange}
          className="file-input"
        />

        <div className="upload-text">
          <p>Click to select an audio file</p>
          <span>(MP3, WAV, M4A)</span>
        </div>
      </label>

      {file && (
        <p className="file-name">Selected: {file.name}</p>
      )}

      <button
        className="upload-btn"
        onClick={handleUpload}
        disabled={uploading}
      >
        {uploading ? "Uploading..." : "Upload"}
      </button>

      {status && <p className="status-text">{status}</p>}
    </div>
  );
}
