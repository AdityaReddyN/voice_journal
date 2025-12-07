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
    origin: ["http://127.0.0.1:5173","http://localhost:5173"],
    credentials: true,
}));

const __filename = fileURLToPath(import.meta.url); 
const __dirname = path.dirname(__filename); 
app.use(express.static(path.join(__dirname, "../frontend")));


app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

app.use("/api/auth", authRoutes);
app.use("/api/status", statusRoutes);
app.use("/api", uploadRoutes);


app.listen(PORT, () => {
  console.log(`🎬 Server running on http://127.0.0.1:${PORT}`);
});