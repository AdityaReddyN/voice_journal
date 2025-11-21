import { useState } from "react";
import Login from "./login";
import Registration from "./Registration";
import UploadApp from "./upload";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [page, setPage] = useState("login"); // login | register

  if (token) {
    return <UploadApp />;
  }

  return (
    <>
      {page === "login" && <Login onLogin={setToken} goRegister={() => setPage("register")} />}
      {page === "register" && <Registration goLogin={() => setPage("login")} />}
    </>
  );
}
