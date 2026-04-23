import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: String,
    email: String,
    password: String,

    // 🔥 Additional fields (Add Info)
    name: String,
    bio: String,
    birthday: Date,
    phone: String,
    loc: String,
    gender: String,

    // optional
    profilePic: String
  },
  { timestamps: true }
);

const Userinfo= mongoose.model("Userinfo", userSchema);
export default Userinfo;