import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    description: String,
    price: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["Private", "Shared"],
      required: true,
    },

    services: {
      type: [String],
      default: [],
    },
image: {
        type: String,
        required: true
    },
    image_id: {
        type: String,
        // required: true
    },

    // location: {
    //   type: {
    //     type: String,
    //     enum: ["Point"],
    //     default: "Point",
    //   },
    //   coordinates: {
    //     type: [Number],
    //     // required: true,
    //   },
    // },

    address: String,

    // postedBy: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "User",
    // },
  },
  { timestamps: true }
);

roomSchema.index({ location: "2dsphere" });
const Room = mongoose.model("Room", roomSchema);
export default Room;