// user model
import mongoose from "mongoose";
const userSchema = new mongoose.Schema({
  username:{
    type:String,
    require:true,
    unique:true},
 image: {
        type: String,
        required: true},
    image_id: {
        type: String,
        required: true},
 email:{
    type:String,
    require:true,
    unique:true},
  password:{
    type:String,
    require:true,
    minLength:[8,"Password should be at least 8 characters"],
    select:false},
  phone:String,
  role:{
    type:String,
    default:"user",
    enum:["user","admin"]}
  ,createdAt:{
    type:Date,
    default:Date.now},
},{timestamps:true});
const User=mongoose.model("User",userSchema);
export default User