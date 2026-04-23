import mongoose from "mongoose";

const roommateSchema = new mongoose.Schema({
  title: String,
  description: String,
  city: String,
  rent: Number,
  contact: String,
  gender: String
}, { timestamps: true });
const Roommate =mongoose.model("Roommate", roommateSchema);
export default Roommate;