import { v2 as cloudinary } from "cloudinary";
import { getDataUrl } from "../utils/buffer.js";
import Room from "../models/room.js";
import mongoose from "mongoose";


export const addroom = async (req, res) => {
  try {
    const { title, description, price, status, address } = req.body;

    console.log("BODY:", req.body);
    console.log("FILE:", req.file);

    // ✅ parse services (bulletproof)
    let services = [];

    if (req.body.services) {
      if (typeof req.body.services === "string") {
        try {
          services = JSON.parse(req.body.services);
        } catch {
          services = [];
        }
      } else if (Array.isArray(req.body.services)) {
        services = req.body.services;
      }
    }

    console.log("FINAL SERVICES:", services);

    // validation
    if (!title || !description || !price || !status || !address) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Image is required"
      });
    }

    const fileBuffer = getDataUrl(req.file);

    const cloud = await cloudinary.uploader.upload(fileBuffer.content, {
      folder: "Rooms"
    });

    const result = await Room.create({
      title,
      description,
      price,
      status,
      address,
      services, // ✅ now always correct
      image: cloud.secure_url,
      image_id: cloud.public_id,
    });

    res.status(201).json({
      success: true,
      message: "Room Created !!!",
      result
    });

  } catch (error) {
    console.error("add room error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

export const getRoom = async (req, res) => {
  try {
    const rooms = await Room.find()
      .sort({ createdAt: -1 })
      .lean();

    // ✅ Fix old data (if services stored as string earlier)
    const formattedRooms = rooms.map((room) => {
      let services = [];

      if (room.services) {
        if (Array.isArray(room.services)) {
          services = room.services;
        } else if (typeof room.services === "string") {
          try {
            services = JSON.parse(room.services);
          } catch {
            services = [];
          }
        }
      }

      return {
        ...room,
        services, // ✅ always array now
      };
    });

    return res.status(200).json({
      success: true,
      message: "Rooms fetched successfully",
      rooms: formattedRooms,
    });

  } catch (error) {
    console.error("getRoom error:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching rooms",
    });
  }
};

export const getRoomById = async (req, res) => {
  try {
    const { id } = req.params;

    // 🔴 Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid room ID"
      });
    }

    const room = await Room.findById(id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found"
      });
    }

    res.status(200).json({
      success: true,
      room
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error fetching room"
    });
  }
};



// ================= DELETE ROOM =================
export const deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;

    // 🔴 Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid room ID"
      });
    }

    const room = await Room.findById(id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found"
      });
    }

    // 🧹 Delete images from Cloudinary
    if (room.image && room.image.length > 0) {
      for (const img of room.image) {
        if (img.public_id) {
          await cloudinary.uploader.destroy(img.public_id);
        }
      }
    }

    await Room.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Room deleted successfully"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error deleting room"
    });
  }
};



export const searchroom = async (req, res) => {
  try {
    const { address, area, status } = req.query;

    let query = {};

    // 🔍 Combine address + area into one search
    if (address || area) {
      const searchText = `${address || ""} ${area || ""}`.trim();

      query.address = {
        $regex: searchText,
        $options: "i",
      };
    }

    // 🔍 Status exact match
    if (status) {
      query.status = {
        $regex: `^${status}$`,
        $options: "i",
      };
    }

    const rooms = await Room.find(query);

    res.status(200).json(rooms);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching rooms",
      error: error.message,
    });
  }
};