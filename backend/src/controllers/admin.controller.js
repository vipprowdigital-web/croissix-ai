import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Admin from "../models/admin.model.js";
import User from "../models/user.model.js";
import Subscription from "../models/subscription.model.js";

// ── Auth ──────────────────────────────────────────────────────────

export const adminRegister = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existing = await Admin.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Admin with this email already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const admin = await Admin.create({ name, email, password: hashed });

    const token = jwt.sign(
      { id: admin._id, email: admin.email, isAdmin: true },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    return res.status(201).json({
      message: "Admin registered successfully",
      token,
      admin: { id: admin._id, name: admin.name, email: admin.email },
    });
  } catch (error) {
    console.error("Admin register error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, admin.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: admin._id, email: admin.email, isAdmin: true },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      admin: { id: admin._id, name: admin.name, email: admin.email },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ── Users ─────────────────────────────────────────────────────────

export const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || "";

    const query = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { phone: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      User.find(query)
        .select("-password -refreshToken -googleAccessToken -googleRefreshToken -facebookAccessToken -facebookPageToken")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    return res.status(200).json({
      users,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("getAllUsers error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password -refreshToken -googleAccessToken -googleRefreshToken -facebookAccessToken -facebookPageToken")
      .lean();

    if (!user) return res.status(404).json({ message: "User not found" });
    return res.status(200).json({ user });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { name, email, phone } },
      { new: true, runValidators: true, select: "-password" },
    ).lean();

    if (!updated) return res.status(404).json({ message: "User not found" });
    return res.status(200).json({ message: "User updated", user: updated });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "User not found" });
    // Also remove their subscriptions
    await Subscription.deleteMany({ user: req.params.id });
    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ── Subscriptions ─────────────────────────────────────────────────

export const getAllSubscriptions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status || "";

    const query = status ? { status } : {};

    const [subscriptions, total] = await Promise.all([
      Subscription.find(query)
        .populate("user", "name email phone avatar")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Subscription.countDocuments(query),
    ]);

    return res.status(200).json({
      subscriptions,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("getAllSubscriptions error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ── Stats ─────────────────────────────────────────────────────────

export const getDashboardStats = async (req, res) => {
  try {
    const [totalUsers, totalSubs, activeSubs, revenue] = await Promise.all([
      User.countDocuments(),
      Subscription.countDocuments(),
      Subscription.countDocuments({ status: "active" }),
      Subscription.aggregate([
        { $match: { status: "active" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);

    return res.status(200).json({
      totalUsers,
      totalSubscriptions: totalSubs,
      activeSubscriptions: activeSubs,
      totalRevenue: revenue[0]?.total || 0,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};
