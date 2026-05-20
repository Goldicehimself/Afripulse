const prisma = require("../config/prisma");
const { withMongoId, withMongoIds } = require("../utils/dbShape");

const listPredictions = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit || "10", 10), 1),
      50
    );
    const skip = (page - 1) * limit;

    const where = {};
    if (req.query.userName) {
      where.userName = req.query.userName;
    }
    if (req.query.status) {
      where.status = req.query.status;
    }

    const [items, total] = await Promise.all([
      prisma.prediction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.prediction.count({ where }),
    ]);

    res.json({
      items: withMongoIds(items),
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

    const created = await prisma.prediction.create({
      data: {
      userName: req.user?.name || "AfriPulse Fan",
      userId: req.user?.userId || null,
      matchLabel,
      competition: competition || "",
      matchId: matchId || null,
      pick,
      predictedScore: predictedScore || "",
      status: "Pending",
      points: 0,
      },
    });

    res.status(201).json(withMongoId(created));
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

    const rows = await prisma.prediction.groupBy({
      by: ["userName"],
      _sum: { points: true },
      orderBy: { _sum: { points: "desc" } },
      take: limit,
    });

    res.json({
      items: rows.map((row) => ({
        name: row.userName,
        points: row._sum.points || 0,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to load leaderboard." });
  }
};

module.exports = { listPredictions, createPrediction, leaderboard };
