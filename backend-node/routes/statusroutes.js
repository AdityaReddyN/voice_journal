
import express from "express";
import { checkStatus } from "../controller/statuscontroller.js";

const router = express.Router();

router.get("/:id", checkStatus);

export default router;
