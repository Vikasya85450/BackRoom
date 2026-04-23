import express from "express";
import { createRoommate, getRoommates } from "../controller/roommate.js";

const router = express.Router();


router.post("/roommates", createRoommate);
router.get("/roommates", getRoommates);


export default router;