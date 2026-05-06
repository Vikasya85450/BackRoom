import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,},
description: String,
    price: {
      type: Number,
      required: true,},
    status: {
      type: String,
      enum: ["Private", "Shared"],
      required: true,},
    services: {
      type: [String],
      default: [], },
image: {
        type: String,
        required: true},
    image_id: {
        type: String,
    },
    address: String,
    phone: {
  type: String,
  required: true}
  },
  { timestamps: true }
);
roomSchema.index({ location: "2dsphere" });
const Room = mongoose.model("Room", roomSchema);
export default Room;