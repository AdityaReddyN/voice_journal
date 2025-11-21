import { useState } from "react";
import axios from "axios";
import "./registration.css";

export default function Registration({ onBackToLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const handleRegister = async () => {
    try {
      await axios.post("http://localhost:3000/api/register", {
        email,
        password,
      });

      setMsg("Registration successful! Go back to login.");
    } catch (err) {
      setMsg("Something went wrong.");
      console.log(err);
    }
  };

  return (
    <div className="register-container">
      <h2>Create Account</h2>

      {msg && <p className="register-msg">{msg}</p>}

      <input
        type="email"
        placeholder="Email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Choose a password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={handleRegister}>Register</button>

      <p className="back" onClick={onBackToLogin}>
        Back to Login
      </p>
    </div>
  );
}
