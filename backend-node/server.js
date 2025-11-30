import connectDB from "./db.js";
import authRoutes from "./routes/authroutes.js";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import {fileURLToPath} from "url";
import path from "path";
import uploadRoutes from "./routes/uploadroutes.js";
import statusRoutes from "./routes/statusroutes.js";




dotenv.config();

const PORT =3000;

connectDB();

const app = express();
//app.use(cors());
app.use(express.json());
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
}));

const __filename = fileURLToPath(import.meta.url); 
const __dirname = path.dirname(__filename); 
app.use(express.static(path.join(__dirname, "../frontend")));

app.use("/api/auth", authRoutes);
app.use("/api", uploadRoutes);
app.use("/api/status", statusRoutes);


app.listen(PORT, () => {
  console.log(`🎬 Server running on http://localhost:${PORT}`);
});