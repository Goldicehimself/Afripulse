const Prediction = require("../models/Prediction");

const listPredictions = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit || "10", 10), 1),
      50
    );
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.userName) {
      filter.userName = req.query.userName;
    }
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const [items, total] = await Promise.all([
      Prediction.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Prediction.countDocuments(filter),
    ]);

    res.json({
      items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to load predictions." });
  }
};

const createPrediction = async (req, res) => {
  try {
    const {
      matchLabel,
      competition,
      matchId,
      pick,
      predictedScore,
    } = req.body || {};

    if (!matchLabel || !pick) {
      return res.status(400).json({ message: "Match and pick are required." });
    }

    const created = await Prediction.create({
      userName: req.user?.name || "AfriPulse Fan",
      userId: req.user?.userId || null,
      matchLabel,
      competition: competition || "",
      matchId: matchId || null,
      pick,
      predictedScore: predictedScore || "",
      status: "Pending",
      points: 0,
    });

    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ message: "Failed to submit prediction." });
  }
};

const leaderboard = async (req, res) => {
  try {
    const limit = Math.min(
      Math.max(parseInt(req.query.limit || "10", 10), 1),
      50
    );

    const rows = await Prediction.aggregate([
      {
        $group: {
          _id: "$userName",
          points: { $sum: "$points" },
        },
      },
      { $sort: { points: -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          name: "$_id",
          points: 1,
        },
      },
    ]);

    res.json({ items: rows });
  } catch (err) {
    res.status(500).json({ message: "Failed to load leaderboard." });
  }
};

module.exports = { listPredictions, createPrediction, leaderboard };
