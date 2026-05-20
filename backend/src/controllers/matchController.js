const prisma = require("../config/prisma");
const {
  defaultMatchPrediction,
  defaultReactions,
  defaultTeam,
  withMongoId,
  withMongoIds,
} = require("../utils/dbShape");

const listMatches = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit || "10", 10), 1),
      50
    );
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.match.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.match.count(),
    ]);

    res.json({
      items: withMongoIds(items),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to load matches." });
  }
};

const getMatchById = async (req, res) => {
  try {
    const match = await prisma.match.findUnique({ where: { id: req.params.id } });
    if (!match) {
      return res.status(404).json({ message: "Match not found." });
    }
    return res.json(withMongoId(match));
  } catch (err) {
    return res.status(400).json({ message: "Invalid match id." });
  }
};

const createMatch = async (req, res) => {
  try {
    const { competition, home, away } = req.body;
    if (!competition || !home || !away) {
      return res.status(400).json({ message: "Missing required fields." });
    }
    const created = await prisma.match.create({
      data: toMatchData(req.body),
    });
    return res.status(201).json(withMongoId(created));
  } catch (err) {
    return res.status(500).json({ message: "Failed to create match." });
  }
};

const updateMatch = async (req, res) => {
  try {
    const existing = await prisma.match.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ message: "Match not found." });
    }
    const updated = await prisma.match.update({
      where: { id: req.params.id },
      data: toMatchData({ ...existing, ...req.body }),
    });
    return res.json(withMongoId(updated));
  } catch (err) {
    return res.status(400).json({ message: "Invalid match id." });
  }
};

const deleteMatch = async (req, res) => {
  try {
    const deleted = await prisma.match.findUnique({ where: { id: req.params.id } });
    if (!deleted) {
      return res.status(404).json({ message: "Match not found." });
    }
    await prisma.match.delete({ where: { id: req.params.id } });
    return res.json({ message: "Match deleted." });
  } catch (err) {
    return res.status(400).json({ message: "Invalid match id." });
  }
};

const toMatchData = (payload) => ({
  competition: payload.competition,
  stage: payload.stage || "",
  venue: payload.venue || "",
  status: payload.status || "LIVE",
  minute: Number(payload.minute || 0),
  half: payload.half || "",
  home: defaultTeam(payload.home),
  away: defaultTeam(payload.away),
  events: Array.isArray(payload.events) ? payload.events : [],
  prediction: defaultMatchPrediction(payload.prediction),
  stats: Array.isArray(payload.stats) ? payload.stats : [],
  topPredictors: Array.isArray(payload.topPredictors) ? payload.topPredictors : [],
  reactions: { ...defaultReactions(), ...(payload.reactions || {}) },
});

module.exports = {
  listMatches,
  getMatchById,
  createMatch,
  updateMatch,
  deleteMatch,
};
