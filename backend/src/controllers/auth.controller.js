import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

// Register a New User

export const register = async (req, res) => {
  try {
    console.log("📥 Register payload:", req.body);
    const { name, email, phone, password } = req.body;
    email = email.trim().toLowerCase();

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // check phone
    const existingPhone = await User.findOne({ phone });

    if (existingPhone) {
      return res.status(400).json({
        message: "Phone number already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      provider: "local",
    });

    res.status(201).json({
      message: "User registered successfully.",
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Register error:", error.message);
    res.status(500).json({ message: "Internal Server Error." });
  }
};

// Login User via email & password

export const login = async (req, res) => {
  try {
    let { email, password } = req.body;

    // Normalize email (avoid case sensitivity issues)
    email = email?.trim().toLowerCase();

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        status: "error",
        message: "Email and password are required.",
        field: !email ? "email" : "password",
      });
    }

    // Check user existence
    const user = await User.findOne({ email });

    // Generic error (avoid telling which field is incorrect for security)
    if (!user) {
      console.error(
        "Login error: Invalid email or password for email e:",
        email,
      );
      return res.status(401).json({
        status: "error",
        message: "Invalid email or password.",
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.error("Login error: password match:", email);
      return res.status(401).json({
        status: "error",
        message: "Invalid email or password.",
      });
    }

    // Generate JWT Token
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        provider: user.provider,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    return res.status(200).json({
      status: "success",
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        provider: user.provider,
        googleId: user.googleId || null,
        googleLocationId: user.googleLocationId || null,
        googleLocationName: user.googleLocationName || null,
        avatar: user.avatar || null,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      status: "error",
      message: "Something went wrong. Please try again later.",
    });
  }
};

// -------------------------
// Google OAuth
// -------------------------
// Link Google Account
export const linkGoogleAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      googleId,
      googleAccessToken,
      googleRefreshToken,
      googleTokenExpiry,
    } = req.body;

    if (!googleId) {
      return res.status(400).json({
        message: "Google ID is required",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // prevent linking multiple accounts
    const existingGoogleUser = await User.findOne({ googleId });

    if (existingGoogleUser && existingGoogleUser._id.toString() !== userId) {
      return res.status(400).json({
        message: "This Google account is already linked to another user.",
      });
    }

    user.googleId = googleId;
    user.googleAccessToken = googleAccessToken;
    user.googleRefreshToken = googleRefreshToken;
    user.googleTokenExpiry = googleTokenExpiry;
    user.provider = "google";

    await user.save();

    return res.status(200).json({
      message: "Google account linked successfully",
      user,
    });
  } catch (error) {
    console.error("Google link error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// -------------------------
// Logout user (JWT) - optimized
// -------------------------
export const logout = async (req, res) => {
  try {
    // If you want, implement token blacklist in DB/Redis for server-side invalidation
    return res.status(200).json({
      message:
        "Logout successful. Please remove the token from client storage.",
    });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ message: "Internal Server Error." });
  }
};
