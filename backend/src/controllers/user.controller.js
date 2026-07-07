import User from "../models/user.model.js";
import Business from "../models/business.model.js";
import {
  destroyFromCloudinary,
  uploadToCloudinary,
} from "../utils/cloudinaryService.js";

// Get Logged-in User's to these Profile
export const getProfile = async (req, res) => {
  try {
    console.log("Inside getProfile...... from backend");

    const userId = req.user?.id;
    console.log("userId: ", userId);

    if (!userId) {
      console.log("user id : ", userId);

      console.log("Unauthorized. Please login again.");

      return res.status(401).json({
        message: "Unauthorized. Please login again.",
      });
    }

    const user = await User.findById(userId).select("-password").lean();
    console.log("User: ", user);

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    const business = await Business.findOne({ owner: userId }).lean();

    return res.status(200).json({
      message: "Profile fetch successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        provider: user.provider,
        googleId: user.googleId,
        googleAccessToken: user.googleAccessToken,
        googleRefreshToken: user.googleRefreshToken,
        googleTokenExpiry: user.googleTokenExpiry,
        googleLocationId: user.googleLocationId || null,
        googleLocationName: user.googleLocationName || null,
        avatar: user.avatar || null,
        createdAt: user.createdAt,
        businessName: business?.businessName || null,
        employeeCount: business?.employeeCount ?? null,
        city: business?.city || null,
        state: business?.state || null,
      },
    });
  } catch (error) {
    console.error("Error fetching profile:", error.message);

    return res.status(500).json({
      message: "Error fetching profile.",
    });
  }
};

// ✅ Update Logged-in User's Profile
export const updateProfileById = async (req, res) => {
  try {
    // ✅ Use ID from token (set by ensureAuth middleware)
    const userId = req.user?.id;
    const { name, email, phone, businessName, employeeCount, city, state } =
      req.body || {};

    if (!userId) {
      return res
        .status(401)
        .json({ message: "Unauthorized. Please login again." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const business = await Business.findOne({ owner: userId });

    let updatedFields = {};
    let updatedBusinessFields = {};
    let avatarUrl = null;

    // ✅ Handle avatar upload (form-data)

    console.log("req.files: ", req.files);
    if (req.files?.avatar?.[0]?.path) {
      try {
        const upload = await uploadToCloudinary(
          req.files.avatar[0].path,
          "users/avatar",
        );
        avatarUrl = upload.secure_url;

        // Delete old avatar if exists
        if (user.avatar) {
          const oldPublicId = user.avatar.split("/").pop().split(".")[0];
          await destroyFromCloudinary(`users/avatar/${oldPublicId}`);
        }

        updatedFields.avatar = avatarUrl;
      } catch (err) {
        console.error("⚠️ Avatar upload failed:", err.message);
        return res.status(500).json({
          message: "Avatar upload failed. Please try again.",
        });
      }
    }

    // ✅ Update name/email/phone if provided
    if (name && name !== user.name) updatedFields.name = name;
    if (email && email !== user.email) updatedFields.email = email;
    if (phone && phone !== user.phone) updatedFields.phone = phone;

    // ✅ Update business details if provided
    if (businessName && businessName !== business?.businessName)
      updatedBusinessFields.businessName = businessName;
    if (
      employeeCount !== undefined &&
      employeeCount !== "" &&
      Number(employeeCount) !== business?.employeeCount
    )
      updatedBusinessFields.employeeCount = Number(employeeCount);
    if (city && city !== business?.city) updatedBusinessFields.city = city;
    if (state && state !== business?.state) updatedBusinessFields.state = state;

    // ✅ If nothing changed
    if (
      Object.keys(updatedFields).length === 0 &&
      Object.keys(updatedBusinessFields).length === 0
    ) {
      return res.status(400).json({ message: "No changes detected." });
    }

    // ✅ Update user
    if (Object.keys(updatedFields).length > 0) {
      await User.findByIdAndUpdate(
        userId,
        { $set: updatedFields },
        { runValidators: true },
      );
    }

    // ✅ Update (or create, if missing) the linked business record
    if (Object.keys(updatedBusinessFields).length > 0) {
      const canCreate = business || updatedBusinessFields.businessName;
      if (canCreate) {
        await Business.findOneAndUpdate(
          { owner: userId },
          {
            $set: updatedBusinessFields,
            $setOnInsert: { owner: userId },
          },
          { upsert: true, runValidators: true },
        );
      }
    }

    const updatedUser = await User.findById(userId).select("-password").lean();
    const updatedBusiness = await Business.findOne({ owner: userId }).lean();

    return res.status(200).json({
      message: "✅ User profile updated successfully.",
      data: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        provider: updatedUser.provider,
        googleId: updatedUser.googleId,
        googleLocationId: updatedUser.googleLocationId || null,
        googleLocationName: updatedUser.googleLocationName || null,
        avatar: updatedUser.avatar || null,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
        businessName: updatedBusiness?.businessName || null,
        employeeCount: updatedBusiness?.employeeCount ?? null,
        city: updatedBusiness?.city || null,
        state: updatedBusiness?.state || null,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || "field";
      return res.status(409).json({
        message: `This ${field} is already in use.`,
      });
    }

    console.error("❌ Error updating user profile:", error);
    return res.status(500).json({
      message: "Internal Server Error while updating profile.",
      error: error.message,
    });
  }
};

// Set Google Location
export const setGoogleLocation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { locationId, locationName } = req.body;

    if (!locationId) {
      return res.status(400).json({
        message: "Location ID is required",
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        googleLocationId: locationId,
        googleLocationName: locationName,
      },
      { new: true },
    ).select("-password");

    return res.status(200).json({
      message: "Google location linked successfully",
      user,
    });
  } catch (error) {
    console.error("Google location link error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
