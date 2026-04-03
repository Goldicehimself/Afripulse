const mongoose = require("mongoose");

const achievementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    meta: { type: String, default: "" },
    locked: { type: Boolean, default: false },
  },
  { _id: false }
);

const profileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true },
    name: { type: String, default: "AfriPulse Fan" },
    handle: { type: String, default: "@pulsefan" },
    bio: { type: String, default: "" },
    location: { type: String, default: "" },
    memberSince: { type: String, default: "Jan 2024" },
    avatarUrl: { type: String, default: "" },
    followers: { type: Number, default: 0 },
    following: { type: Number, default: 0 },
    stats: {
      predictionPoints: { type: Number, default: 0 },
      accuracyRate: { type: Number, default: 0 },
      reactionsGiven: { type: Number, default: 0 },
      dailyStreak: { type: Number, default: 0 },
    },
    achievements: { type: [achievementSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Profile", profileSchema);
