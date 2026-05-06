import Room from "../models/room.js";
import Chat from "../models/chat.js";

import stringSimilarity from "string-similarity";

export const smartChat = async (req, res) => {
  try {
    const { message, location, userId = "guest" } = req.body;

    // 🔹 1. Normalize text
    let text = message.toLowerCase();

    // 🔹 2. SPELL CORRECTION
    const dictionary = ["lucknow", "kanpur", "delhi", "pg", "bhk", "room"];

    const correctWord = (word) => {
      const match = stringSimilarity.findBestMatch(word, dictionary);
      return match.bestMatch.rating > 0.6 ? match.bestMatch.target : word;
    };

    text = text
      .split(" ")
      .map(w => correctWord(w))
      .join(" ");

    // 🔹 3. HINGLISH SUPPORT
    const hinglishMap = {
      "sasta": "cheap",
      "mehenga": "expensive",
      "kam": "low",
      "zyada": "high",
      "ghar": "room",
      "kiraya": "rent",
      "chahiye": "",
      "ke andar": "under"
    };

    Object.keys(hinglishMap).forEach(word => {
      text = text.replaceAll(word, hinglishMap[word]);
    });

    // 🔹 4. ISSUE DETECTION
    if (
      text.includes("problem") ||
      text.includes("issue") ||
      text.includes("not working") ||
      text.includes("error") ||
      text.includes("unable")
    ) {
      return res.json({
        reply: "Sorry for inconvenience 😔 Please describe your issue or contact support."
      });
    }

    // 🔹 5. FILTER EXTRACTION
    let filters = {
      location: "",
      price: null,
      type: ""
    };

    // type
    if (text.match(/1\s?bhk/)) filters.type = "1 BHK";
    if (text.match(/2\s?bhk/)) filters.type = "2 BHK";
    if (text.match(/3\s?bhk/)) filters.type = "3 BHK";
    if (text.includes("pg")) filters.type = "PG";

    // price
    const priceMatch = text.match(/\d+/);
    if (priceMatch) filters.price = Number(priceMatch[0]);

    if (text.includes("cheap")) filters.price = 3000;
    if (text.includes("budget")) filters.price = 4000;

    // location
    const cities = ["lucknow", "kanpur", "delhi", "noida"];
    cities.forEach(city => {
      if (text.includes(city)) filters.location = city;
    });

    // 🔹 6. PERSONALIZATION (basic)
    const userPrefs = {
      budget: 5000,
      preferredCity: "lucknow"
    };

    if (!filters.price) filters.price = userPrefs.budget;
    if (!filters.location) filters.location = userPrefs.preferredCity;

    // 🔹 7. QUERY
    let query = {};

    // near me
    if (text.includes("near me") && location) {
      query = {
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [location.longitude, location.latitude]
            },
            $maxDistance: 5000
          }
        }
      };
    } else {
      if (filters.location) {
        query.address = { $regex: filters.location, $options: "i" };
      }

      if (filters.price) {
        query.price = { $lte: filters.price };
      }

      if (filters.type) {
        query.title = { $regex: filters.type, $options: "i" };
      }
    }

    let rooms = await Room.find(query);

    // 🔹 8. SMART RANKING
    const rankRooms = (rooms) => {
      return rooms.sort((a, b) => {
        let scoreA = 0;
        let scoreB = 0;

        if (filters.price) {
          scoreA += Math.abs(filters.price - a.price);
          scoreB += Math.abs(filters.price - b.price);
        }

        if (filters.type && a.title.includes(filters.type)) scoreA -= 10;
        if (filters.type && b.title.includes(filters.type)) scoreB -= 10;

        return scoreA - scoreB;
      });
    };

    rooms = rankRooms(rooms).slice(0, 5);

    // 🔹 9. RESPONSE
    let reply = "";

    if (rooms.length > 0) {
      reply = `Found ${rooms.length} rooms for you 👇`;
    } else {
      reply = "No rooms found 😕 Try different filters.";
    }

    // 🔹 10. SAVE CHAT
    await Chat.create({
      userId,
      message,
      reply
    });

    res.json({ reply, rooms });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};