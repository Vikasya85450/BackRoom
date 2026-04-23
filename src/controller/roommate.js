import Roommate from "../models/roommate.js";

export const createRoommate = async (req, res) => {
    console.log("hit cont of createroom");
    
  try {
    const { title, description, city, rent, contact, gender } = req.body;

    // 🧠 Basic validation
    if (!title || !city || !rent || !contact || !gender) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newPost = new Roommate({
      title,
      description,
      city,
      rent,
      contact,
      gender
    });

    await newPost.save();

    res.status(201).json(newPost);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const getRoommates = async (req, res) => {
  try {
    const { query, city, gender, minPrice, maxPrice } = req.query;

    let filter = {};

    // 🔍 SEARCH (multi-word)
    if (query) {
      const words = query.trim().split(/\s+/);

      filter.$and = words.map(word => ({
        $or: [
          { title: { $regex: word, $options: "i" } },
          { description: { $regex: word, $options: "i" } }
        ]
      }));
    }

    // 🎯 FILTERS
    if (city) {
      filter.city = { $regex: city, $options: "i" }; // flexible match
    }

    if (gender) {
      filter.gender = gender; // boys / girls
    }

    if (minPrice || maxPrice) {
      filter.rent = {};
      if (minPrice) filter.rent.$gte = Number(minPrice);
      if (maxPrice) filter.rent.$lte = Number(maxPrice);
    }

    const roommates = await Roommate.find(filter).sort({ createdAt: -1 });

    // ✅ IMPORTANT: return array directly (for frontend .map)
    res.status(200).json(roommates);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};