import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

// Register a New User

export const register = async (req, res) => {
  try {
    console.log("📥 Register payload:", req.body);
    const { name, phone, password } = req.body;
    let email = req.body.email?.trim().toLowerCase();

    if (!name || !email || !phone || !password) {
      console.log("Fields required.");

      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("Email already registered");
      return res.status(400).json({ message: "Email already registered" });
    }

    // check phone
    const existingPhone = await User.findOne({ phone });

    if (existingPhone) {
      console.log("Phone number already registered");
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
    // console.log("Inside login: email: ", email, " password: ", password);

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

    // Generate JWT Token - Acccess Token
    const accessToken = jwt.sign(
      {
        id: user._id,
        email: user.email,
        provider: user.provider,
      },
      process.env.JWT_SECRET,
      { expiresIn: "15m" },
    );

    // Generate JWT Token - Refresh Token
    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" },
    );

    // store refresh token
    user.refreshToken = refreshToken;
    await user.save();

    return res.status(200).json({
      status: "success",
      message: "Login successful.",
      accessToken,
      refreshToken,
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
    console.log("🔵 LINK GOOGLE BODY:", req.body);
    console.log("🔵 AUTH USER:", req.user);

    const userId = req.user?.id;

    if (!userId) {
      console.log("User is missing.");
      return res.status(401).json({
        message: "Unauthorized: Missing user",
      });
    }

    let { googleId, googleAccessToken, googleRefreshToken, googleTokenExpiry } =
      req.body;

    // ✅ FIX 1: fallback for Google "sub"
    if (!googleId && req.body.sub) {
      googleId = req.body.sub;
    }

    if (!googleId) {
      console.log("Google ID is required.");
      return res.status(400).json({
        message: "Google ID is required",
        received: req.body,
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      console.log("User not found for linking Google account.");
      return res.status(404).json({
        message: "User not found",
      });
    }

    // ✅ prevent linking multiple accounts
    const existingGoogleUser = await User.findOne({ googleId });

    if (existingGoogleUser && existingGoogleUser._id.toString() !== userId) {
      return res.status(400).json({
        message: "This Google account is already linked to another user.",
      });
    }

    // ✅ FIX 2: safe updates (don't overwrite with undefined)
    user.googleId = googleId;

    // ✅ ADD THESE (IMPORTANT)
    user.googleAccountEmail = req.body.email || user.googleAccountEmail;
    user.googleAccountName = req.body.name || user.googleAccountName;

    user.googleAccessToken = googleAccessToken || user.googleAccessToken;
    user.googleRefreshToken = googleRefreshToken || user.googleRefreshToken; // ⭐ important
    user.googleTokenExpiry = googleTokenExpiry || user.googleTokenExpiry;

    user.provider = "google";

    await user.save();

    return res.status(200).json({
      message: "Google account linked successfully",
      user,
    });
  } catch (error) {
    console.error("❌ Google link error:", error);

    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// -------------------------
// Refresh Token (JWT)
// -------------------------
// -------------------------
// Refresh Token (JWT)
// -------------------------
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken: incomingToken } = req.body;

    if (!incomingToken) {
      return res.status(401).json({
        status: "error",
        message: "Refresh token required",
      });
    }

    // verify refresh token
    const decoded = jwt.verify(incomingToken, process.env.JWT_REFRESH_SECRET);

    // fetch user
    const user = await User.findById(decoded.id)
      .select("email provider refreshToken")
      .lean();

    if (!user || user.refreshToken !== incomingToken) {
      return res.status(403).json({
        status: "error",
        message: "Invalid refresh token",
      });
    }

    // generate new access token
    const newAccessToken = jwt.sign(
      {
        id: user._id,
        email: user.email,
        provider: user.provider,
      },
      process.env.JWT_SECRET,
      { expiresIn: "15m" },
    );

    return res.status(200).json({
      status: "success",
      accessToken: newAccessToken,
    });
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(403).json({
        status: "error",
        message: "Refresh token expired",
      });
    }

    return res.status(403).json({
      status: "error",
      message: "Invalid refresh token",
    });
  }
};

// -------------------------
// Logout user (JWT) - optimized
// -------------------------
export const logout = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user) {
      user.refreshToken = null;
      await user.save();
    }
    return res.status(200).json({
      message:
        "Logout successful. Please remove the token from client storage.",
    });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ message: "Internal Server Error." });
  }
};


