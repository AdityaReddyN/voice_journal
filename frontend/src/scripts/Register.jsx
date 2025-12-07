import { useState } from "react"
import axios from "axios"
import "./styles/Register.css"

export default function Register({ onBackToLogin }){
    const [Email, setEmail] = useState("")
    const [Password, setPassword] = useState("")
    const [ConfirmPassword, setConfirmPassword] = useState("")
    const [Username, setUsername] = useState("")
    const [Err, setErr] = useState("")
    const [Success, setSuccess] = useState("")

    const HandleRegister = async(e) => {
        e.preventDefault();
        setErr("");
        setSuccess("");

        // Validation
        if(!Email || !Password || !ConfirmPassword || !Username){
            setErr("Fill all the required fields!");
            return 
        }

        if(Password !== ConfirmPassword){
            setErr("Passwords do not match!");
            return
        }

        try{
            const res = await axios.post("http://127.0.0.1:3000/api/auth/register", {
                name: Username,
                email: Email,
                password: Password,
            });

            setSuccess("Registration successful! You can now login.");
            console.log(res.data);
        
            setEmail("");
            setPassword("");
            setConfirmPassword("");
            setUsername("");

            // Redirect to loginn
            setTimeout(() => {
                onBackToLogin();
            }, 2000);
        }
        catch(err){
            console.log(err)
            setErr(err.response?.data?.message || "Registration failed");
        }
    }

    return (
        <form onSubmit={HandleRegister} className="register-form">
            <h1 id="main-title">Voice Journal</h1>
            <div className="register-container">
                <h3>Create Account</h3>
                
                <input 
                    id="username" 
                    placeholder="Enter your Username"
                    type="text"
                    value={Username}
                    onChange={e => setUsername(e.target.value)}
                />
                
                <input 
                    id="email" 
                    placeholder="Enter your Email"
                    type="email"
                    value={Email}
                    onChange={e => setEmail(e.target.value)}
                />
                
                <input 
                    id="password" 
                    placeholder="Enter your Password" 
                    type="password"
                    value={Password} 
                    onChange={e => setPassword(e.target.value)}
                />
                
                <input 
                    id="confirm-password" 
                    placeholder="Confirm your Password" 
                    type="password"
                    value={ConfirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)}
                />
                
                {Err && <p className="error-message">{Err}</p>}
                {Success && <p className="success-message">{Success}</p>}
                
                <button id="register-btn" type="submit">Register</button>
                
                <a 
                    href="#" 
                    onClick={(e) => {e.preventDefault(); onBackToLogin()}} 
                    className="login-link"
                >
                    Already have an account? Login
                </a>
            </div>
        </form>
    )
}