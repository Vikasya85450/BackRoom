import crypto from "crypto";
import User from "../models/user.js";
import { catchAsyncError } from "../utils/catchAsyncError.js";
import ErrorHandler from "../utils/error.js";
import {
  checkOtpRestrictions,
  sendOtpByEmail,
  trackOtpRequests,
} from "../utils/authHelper.js";

import redis from "../config/redis.js";
import { hashPassword, comparePassword } from "../utils/passwordUtils.js";
import { generateToken } from "../utils/generateToken.js";
import { sendEmail } from "../utils/Email.js";

// Cloudinary
import { v2 as cloudinary } from "cloudinary";
import { getDataUrl } from "../utils/buffer.js";
import Userinfo from "../models/addinfo.js";
import mongoose from "mongoose";


// ================= REGISTER =================
export const registerUser = catchAsyncError(async (req, res, next) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return next(new ErrorHandler("All fields are required", 400));
  }

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    return next(new ErrorHandler("User already exists", 400));
  }

  await checkOtpRestrictions(email);
  await trackOtpRequests(email);
  await sendOtpByEmail(username, email);

  res.status(200).json({
    success: true,
    message: "OTP sent for signup",
  });
});


// ================= VERIFY OTP =================
export const verifyOtp = catchAsyncError(async (req, res, next) => {
  const { username, email, password, otp } = req.body;
  const file = req.file;

  if (!username || !email || !password || !otp) {
    return next(new ErrorHandler("All fields are required", 400));
  }

  const MAX_ATTEMPTS = 5;

  const savedOtp = await redis.get(`otp:${email}`);

  if (!savedOtp || savedOtp !== otp) {
    const failedKey = `otp_failed:${email}`;
    const failedAttempts =
      parseInt((await redis.get(failedKey)) || "0") + 1;

    await redis.set(failedKey, failedAttempts, "EX", 1800);

    if (failedAttempts >= MAX_ATTEMPTS) {
      await redis.set(`otp_lock:${email}`, "true", "EX", 1800);

      return res.status(403).json({
        success: false,
        message: "Too many failed attempts. Try again later.",
      });
    }

    return res.status(401).json({
      success: false,
      message: `Invalid OTP. Attempts left: ${MAX_ATTEMPTS - failedAttempts}`,
    });
  }

  // clear OTP
  await redis.del(`otp:${email}`);
  await redis.del(`otp_failed:${email}`);
  await redis.del(`otp_request_count:${email}`);

  // upload image to Cloudinary
  if (!req.file) {
   return res.status(400).json({
     success: false,
     message: "Image is required"
   });
 }
 
 
     const fileBuffer = getDataUrl(image);
 
     const cloud = await cloudinary.v2.uploader.upload(
       fileBuffer.content,
       {
         folder: "Users"
       }
     );

  // hash password
  const hashedPassword = await hashPassword(password);

  // create user
  const newUser = await User.create({
    username,
    email,
    password: hashedPassword,
    image: imageUrl,
  });

  // generate token
  const token = generateToken({
    id: newUser._id,
    email,
    name: username,
  });

  res.status(200).json({
    success: true,
    message: "OTP verified successfully",
    token,
    userInfo: {
      _id: newUser._id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
      image: newUser.image,
    },
  });
});


// ================= LOGIN =================
export const loginWithPassword = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorHandler("Email and password are required", 400));
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  const isMatch = await comparePassword(password, user.password);

  if (!isMatch) {
    return next(new ErrorHandler("Incorrect password", 401));
  }

  const token = generateToken({
    id: user._id,
    email: user.email,
    name: user.username,
  });

  res.status(200).json({
    success: true,
    message: "Login successful",
    token,
    userInfo: {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      image: user.image,
    },
  });
});


// ================= FORGOT PASSWORD =================
export const forgotPassword = catchAsyncError(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new ErrorHandler("Email is required", 400));
  }

  const user = await User.findOne({ email });

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  await redis.set(`resetToken:${email}`, hashedToken, "EX", 900);

  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${email}`;

  await sendEmail({
    email,
    subject: "Password Reset",
    message: `<a href="${resetLink}">Reset Password</a>`,
  });

  res.status(200).json({
    success: true,
    message: "Reset link sent",
  });
});


// ================= RESET PASSWORD =================
export const resetPassword = catchAsyncError(async (req, res, next) => {
  const { email, token, newPassword } = req.body;

  if (!email || !token || !newPassword) {
    return next(new ErrorHandler("All fields are required", 400));
  }

  const hashedToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const savedToken = await redis.get(`resetToken:${email}`);

  if (!savedToken || savedToken !== hashedToken) {
    return next(new ErrorHandler("Invalid or expired token", 400));
  }

  const user = await User.findOne({ email });

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  user.password = await hashPassword(newPassword);
  await user.save();

  await redis.del(`resetToken:${email}`);

  res.status(200).json({
    success: true,
    message: "Password reset successful",
  });
});


// ================= PROFILE =================
export const getSignedProfile = catchAsyncError(async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "userId is required",
    });
  }

  const user = await User.findById(userId).select("-password");

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  res.status(200).json({
    success: true,
    user,
  });
});




export const addUserInfo = async (req, res) => {
  try {
    const { userId, name, bio, birthday, phone, loc, gender } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid User ID" });
    }

    const updatedUser = await Userinfo.findByIdAndUpdate(
      userId,
      { name, bio, birthday, phone, loc, gender },
      { new: true }
    );

    res.json(updatedUser);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};