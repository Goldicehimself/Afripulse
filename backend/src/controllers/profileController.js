const Profile = require("../models/Profile");

const getProfile = async (req, res) => {
  try {
    if (!req.user?.userId) {
      return res.status(403).json({ message: "User profile not available." });
    }
    let profile = await Profile.findOne({ userId: req.user.userId });
    if (!profile) {
      profile = await Profile.create({
        userId: req.user.userId,
        name: req.user.name || "AfriPulse Fan",
        handle: `@${(req.user.name || "user").toLowerCase().replace(/\s+/g, "")}`,
        bio: "",
        location: "",
        memberSince: new Date().toLocaleString("en-US", { month: "short", year: "numeric" }),
        followers: 0,
        following: 0,
        stats: {
          predictionPoints: 0,
          accuracyRate: 0,
          reactionsGiven: 0,
          dailyStreak: 0,
        },
        achievements: [],
      });
    }
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: "Failed to load profile." });
  }
};

const updateProfile = async (req, res) => {
  try {
    if (!req.user?.userId) {
      return res.status(403).json({ message: "User profile not available." });
    }
    const update = req.body || {};
    if (req.file && req.file.path) {
      update.avatarUrl = req.file.path;
    }
    const profile = await Profile.findOneAndUpdate(
      { userId: req.user.userId },
      update,
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: "Failed to update profile." });
  }
};

module.exports = { getProfile, updateProfile };
