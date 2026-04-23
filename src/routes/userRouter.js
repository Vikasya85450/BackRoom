import express from "express";
import {
    addUserInfo,
  forgotPassword,
  getSignedProfile,
  loginWithPassword,
  registerUser,
  resetPassword,
  verifyOtp,
} from "../controller/user.js";
import{ uploadFile }from "../utils/multer.js";



const router = express.Router();

// ================= AUTH =================

// Signup (send OTP)
router.post("/signup", registerUser);

// Verify OTP + upload profile image
router.post("/verify-otp", uploadFile.single("image"), verifyOtp);

// Login
router.post("/login", loginWithPassword);

// ================= PASSWORD =================

// Forgot password
router.post("/forgot-password", forgotPassword);

// Reset password
router.post("/reset-password", resetPassword);

// ================= PROFILE =================

// Get profile (Cloudinary URL already stored)
router.get("/profile/:userId", getSignedProfile);
router.post("/add-info", addUserInfo);

export default router;