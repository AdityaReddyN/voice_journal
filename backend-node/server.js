import connectDB from "./db.js";
import authRoutes from "./routes/authRoutes.js";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import {fileURLToPath} from "url";
import path from "path";
dotenv.config();

const PORT =3000;

connectDB();

const app = express();
app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url); 
const __dirname = path.dirname(__filename); 
app.use(express.static(path.join(__dirname, "../frontend")));

app.use("/api/auth", authRoutes);


app.listen(PORT, () => {
  console.log(`🎬 Server running on http://localhost:${PORT}`);
});