import jwt from "jsonwebtoken";
import Admin from "../models/admin.model.js";

export const ensureAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ status: "error", message: "Authorization token missing" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.isAdmin) {
      return res.status(403).json({ status: "error", message: "Admin access required" });
    }

    const admin = await Admin.findById(decoded.id).lean();
    if (!admin) {
      return res.status(401).json({ status: "error", message: "Admin not found" });
    }

    req.admin = { id: admin._id.toString(), email: admin.email, name: admin.name };
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ status: "error", message: "Token expired" });
    }
    return res.status(401).json({ status: "error", message: "Invalid token" });
  }
};
