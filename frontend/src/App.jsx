import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./scripts/Login.jsx";
import Register from "./scripts/Register.jsx";
import UploadPage from "./scripts/Upload.jsx";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/upload" element={<UploadPage />} />
      </Routes>
    </Router>
  );
}
