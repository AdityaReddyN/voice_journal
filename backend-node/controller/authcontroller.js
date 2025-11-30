import user from "../models/user.js"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken";

export const register = async(req,res) =>{
    const {name,email,password} = req.body;
    try{
        const existing =  await user.findOne({email});
        if(existing) return res.status(400).json({message:"User already registered"});
        
        const hashed = await bcrypt.hash(password,10);
        const newUser = await user.create({
            name,
            email,
            password:hashed
        });

        res.json({message:"User Created",newUser});
    }catch(error){
        res.status(500).json({message:"Error",error});
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const checker = await user.findOne({ email });
        if (!checker)
            return res.status(400).json({ message: "Invalid Email or Password" });

        const match = await bcrypt.compare(password, checker.password);
        if (!match)
            return res.status(400).json({ message: "Invalid Email or Password" });

        const token = jwt.sign(
            { id: checker._id },
            process.env.JWT_SECRET,
            { expiresIn: "3d" }
        );

        return res.json({
            message: "Login successful",
            token,
            user: {
                id: checker._id,
                name: checker.name,
                email: checker.email,
            },
        });

    } catch (error) {
        return res.status(500).json({ message: "Error", error });
    }
};

