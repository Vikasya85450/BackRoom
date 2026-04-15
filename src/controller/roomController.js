import Room from "../models/room.js";
import { uploadToB2, getSignedUrlFromB2 } from "../utils/b2.js";
import { v4 as uuidv4 } from "uuid";

// export const createRoom = async (req, res) => {
//   try {
//     const { title, description, rent, type, address } = req.body;

//     const uploadedImages = await Promise.all(
//       (req.files || []).map(async (file) => {
//         const key = `rooms/${uuidv4()}-${file.originalname}`;
//         await uploadToB2({
//           key,
//           body: file.buffer,
//           contentType: file.mimetype,
//         });
//         return key; 
//       })
//     );

//     const room = new Room({
//       title,
//       description,
//       rent,
//       type,
//       address,
//       location: {
//         type: "Point",
//         coordinates: [lng, lat],
//       },
//       images: uploadedImages, 
//       postedBy: req.user?._id,
//     });

//     await room.save();
//     res.status(201).json(room);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Error creating room", error });
//   }
// };

export const createRoom = async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      status,
      services,
      address,
      lat,
      lng,
    } = req.body; 

    // parse services if needed
    const parsedServices =
      typeof services === "string" ? JSON.parse(services) : services;

    // upload images
    const uploadedImages = await Promise.all(
      (req.files || []).map(async (file) => {
        const key = `rooms/${uuidv4()}-${file.originalname}`;

        await uploadToB2({
          key,
          body: file.buffer,
          contentType: file.mimetype,
        });

        return key;
      })
    );

    const room = new Room({
      title,
      description,
      price,          // ✅ correct
      status,         // ✅ correct
      services: parsedServices,
      address,
      location: {
        type: "Point",
        coordinates: [lng, lat], // optional if not required
      },
      image: uploadedImages,
      postedBy: req.user?._id,
    });

    await room.save();

    res.status(201).json(room);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating room", error });
  }
};


export const getRoom = async (req, res) => {
  try {
    const room = await Room.find();
    if (!room) return res.status(404).json({ message: "Room not found" });

    const signedUrls = await Promise.all(
      (room.images || []).map((key) => getSignedUrlFromB2(key))
    );

    res.status(200).json({
      success:"true",
      message:"room find ",
      room
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching room", error });
  }
};

export const getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: "Room not found" });

    const signedUrls = await Promise.all(
      (room.images || []).map((key) => getSignedUrlFromB2(key))
    );

    res.json({ ...room.toObject(), images: signedUrls });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching room", error });
  }
};

// 🗑️ Delete Room
export const deleteRoom = async (req, res) => {
  try {
    await Room.findByIdAndDelete(req.params.id);
    res.json({ message: "Room deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting room", error });
  }
};
 