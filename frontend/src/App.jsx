import { useState } from "react";
import Login from "./login";
import UploadApp from "./upload";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));

  if (!token) {
    return <Login onLogin={setToken} />;
  }

  return <UploadApp />;
}
