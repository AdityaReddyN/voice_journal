import { useState } from "react"
import axios from "axios"
import "./styles/Login.css"
import Register from "./Register.jsx"

export default function Login(){
    const [Email,setEmail] = useState("")
    const [Password,setPassword] = useState("")
    const [Err,setErr] = useState("");
    const [showRegister, setShowRegister] = useState(false);

    // If Register is shown, render Register component
    if(showRegister) {
        return <Register onBackToLogin={() => setShowRegister(false)} />
    }

    const HandleLogin = async(e) =>{
        e.preventDefault();
        if(!Email || !Password){
            setErr("Fill all the required fields!");
            return 
        }
        try{
            const res = await axios.post("http://localhost:3000/api/auth/login", {
                email:Email,
                password:Password,
            });
            localStorage.setItem("token", res.data.token);

            alert("Login successful!");
            console.log(res.data);
        }
        catch(err){
            setErr(err.response?.data?.message || "Login failed");
        }
        
    }

    return <>
    <form onSubmit={HandleLogin} className="login-form">
        <h1 id="main-title">Voice Journal</h1>
        <div className="login-container">
            <h3>LoginPage</h3>
            <input id="email" 
                placeholder="Enter your Email"
                type="text"
                value={Email}
                onChange={e => {setEmail(e.target.value)}}/>
            <input id="password" 
                placeholder="Enter your Password" 
                type="password"
                value={Password} 
                onChange={e => setPassword(e.target.value)}/>
            <p>{Err}</p>
            <button id="login-btn">Login</button>
            <a href="#" onClick={(e) => {e.preventDefault(); setShowRegister(true)}} className="register-link">
                Don't have an account? Register
            </a>
        </div>
    </form>  
    </> 
}