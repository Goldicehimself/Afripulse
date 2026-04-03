const mongoose = require("mongoose");

const predictionSchema = new mongoose.Schema(
  {
    userName: { type: String, default: "AfriPulse Fan" },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    matchLabel: { type: String, required: true },
    competition: { type: String, default: "" },
    matchId: { type: mongoose.Schema.Types.ObjectId, ref: "Match", default: null },
    pick: { type: String, required: true },
    predictedScore: { type: String, default: "" },
    actualResult: { type: String, default: "" },
    status: { type: String, default: "Pending" },
    points: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Prediction", predictionSchema);
