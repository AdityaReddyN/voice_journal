import jwt from "jsonwebtoken"

export const auth = async (req,res,next) =>{
    const token = req.header.authorization?.split(" ")[1]

    if(!token) res.status(401).json({message:"Token not found, access denied"})

    try{
        const decode = jwt.verify(token,process.env.JWT_SECRET);
        req.user = decode.id
        next();
    }catch(error){
        res.json({message:'Invalid token'});
    }
};