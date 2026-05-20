const prisma = require("../config/prisma");
const { defaultProfileStats, withMongoId } = require("../utils/dbShape");

const getProfile = async (req, res) => {
  try {
    if (!req.user?.userId) {
      return res.status(403).json({ message: "User profile not available." });
    }
    let profile = await prisma.profile.findUnique({ where: { userId: req.user.userId } });
    if (!profile) {
      profile = await prisma.profile.create({
        data: {
        userId: req.user.userId,
        name: req.user.name || "AfriPulse Fan",
        handle: `@${(req.user.name || "user").toLowerCase().replace(/\s+/g, "")}`,
        bio: "",
        location: "",
        memberSince: new Date().toLocaleString("en-US", { month: "short", year: "numeric" }),
        followers: 0,
        following: 0,
        stats: {
          ...defaultProfileStats(),
        },
        achievements: [],
        },
      });
    }
    res.json(withMongoId(profile));
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
    const profile = await prisma.profile.upsert({
      where: { userId: req.user.userId },
      update,
      create: {
        userId: req.user.userId,
        name: update.name || req.user.name || "AfriPulse Fan",
        handle: update.handle || `@${(req.user.name || "user").toLowerCase().replace(/\s+/g, "")}`,
        bio: update.bio || "",
        location: update.location || "",
        memberSince: update.memberSince || new Date().toLocaleString("en-US", { month: "short", year: "numeric" }),
        avatarUrl: update.avatarUrl || "",
        followers: Number(update.followers || 0),
        following: Number(update.following || 0),
        stats: update.stats || defaultProfileStats(),
        achievements: update.achievements || [],
      },
    });
    res.json(withMongoId(profile));
  } catch (err) {
    res.status(500).json({ message: "Failed to update profile." });
  }
};

module.exports = { getProfile, updateProfile };
