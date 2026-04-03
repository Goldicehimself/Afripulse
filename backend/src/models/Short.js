const mongoose = require("mongoose");

const reactionSchema = new mongoose.Schema(
  {
    fire: { type: Number, default: 0 },
    cap: { type: Number, default: 0 },
    brain: { type: Number, default: 0 },
    angry: { type: Number, default: 0 },
  },
  { _id: false }
);

const shortSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    image: { type: String, default: "" },
    reactions: { type: reactionSchema, default: () => ({}) },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Short", shortSchema);
