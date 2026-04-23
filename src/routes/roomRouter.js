import express from "express";
import {

  getRoom,
  getRoomById,
  deleteRoom,
  addroom,
  searchroom,
} from "../controller/roomController.js";

import uploadFile from "../utils/multer.js";

const router = express.Router();


router.post("/room", uploadFile.single("image"), addroom);

// ================= READ =================
// get all rooms
router.get("/rooms",searchroom);
router.get("/room", getRoom);

// get single room
// router.get("/:id", getRoomById);


// ================= DELETE =================
router.delete("/:id", deleteRoom);

export default router;