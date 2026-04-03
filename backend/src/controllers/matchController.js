const Match = require("../models/Match");

const listMatches = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit || "10", 10), 1),
      50
    );
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Match.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      Match.countDocuments(),
    ]);

    res.json({
      items,
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
    const match = await Match.findById(req.params.id);
    if (!match) {
      return res.status(404).json({ message: "Match not found." });
    }
    return res.json(match);
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
    const created = await Match.create(req.body);
    return res.status(201).json(created);
  } catch (err) {
    return res.status(500).json({ message: "Failed to create match." });
  }
};

const updateMatch = async (req, res) => {
  try {
    const updated = await Match.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) {
      return res.status(404).json({ message: "Match not found." });
    }
    return res.json(updated);
  } catch (err) {
    return res.status(400).json({ message: "Invalid match id." });
  }
};

const deleteMatch = async (req, res) => {
  try {
    const deleted = await Match.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Match not found." });
    }
    return res.json({ message: "Match deleted." });
  } catch (err) {
    return res.status(400).json({ message: "Invalid match id." });
  }
};

module.exports = {
  listMatches,
  getMatchById,
  createMatch,
  updateMatch,
  deleteMatch,
};
