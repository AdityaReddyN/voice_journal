import { useState } from "react"
import axios from "axios"



export default function Login(){
    const [Email,setEmail] = useState("")
    const [Password,setPassword] = useState("")
    const [Err,setErr] = useState("");


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
        catch{
            setErr(err.response?.data?.message || "Login failed");
        }
        
    }

    return <>
    <form onSubmit={HandleLogin} className="login-form">
        <input id="email" 
            placeholder="Enter your Email"
            type= "text"
            value={Email}
            onChange={e => {setEmail(e.target.value)}}/>
        <input id="password" 
            placeholder="Enter your Password" 
            type="text"
            value={Password} 
            onChange={e => setPassword(e.target.value)}/>
        <p>{Err}</p>
        <button id="login-btn">Login</button>
    </form>  
    </> 
}