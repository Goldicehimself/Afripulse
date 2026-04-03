const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    minute: { type: Number, required: true },
    type: { type: String, default: "event" },
    text: { type: String, required: true },
  },
  { _id: false }
);

const statsSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    home: { type: Number, default: 0 },
    away: { type: Number, default: 0 },
  },
  { _id: false }
);

const teamSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    formation: { type: String, default: "" },
    score: { type: Number, default: 0 },
    badgeUrl: { type: String, default: "" },
  },
  { _id: false }
);

const predictionSchema = new mongoose.Schema(
  {
    userPick: { type: String, default: "" },
    points: { type: Number, default: 0 },
    totals: {
      nigeria: { type: Number, default: 0 },
      draw: { type: Number, default: 0 },
      ghana: { type: Number, default: 0 },
    },
    count: { type: String, default: "0" },
  },
  { _id: false }
);

const predictorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    pick: { type: String, required: true },
    points: { type: Number, default: 0 },
  },
  { _id: false }
);

const matchSchema = new mongoose.Schema(
  {
    competition: { type: String, required: true },
    stage: { type: String, default: "" },
    venue: { type: String, default: "" },
    status: { type: String, default: "LIVE" },
    minute: { type: Number, default: 0 },
    half: { type: String, default: "" },
    home: { type: teamSchema, required: true },
    away: { type: teamSchema, required: true },
    events: [eventSchema],
    prediction: { type: predictionSchema, default: () => ({}) },
    stats: [statsSchema],
    topPredictors: [predictorSchema],
    reactions: {
      fire: { type: Number, default: 0 },
      cap: { type: Number, default: 0 },
      brain: { type: Number, default: 0 },
      angry: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Match", matchSchema);
