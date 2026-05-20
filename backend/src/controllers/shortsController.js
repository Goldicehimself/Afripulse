const prisma = require("../config/prisma");
const { defaultReactions, withMongoId, withMongoIds } = require("../utils/dbShape");

const listShorts = async (req, res) => {
  try {
    const limit = Math.min(
      Math.max(parseInt(req.query.limit || "20", 10), 1),
      50
    );
    const items = await prisma.short.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    res.json({ items: withMongoIds(items) });
  } catch (err) {
    res.status(500).json({ message: "Failed to load shorts." });
  }
};

const createShort = async (req, res) => {
  try {
    const { title, image } = req.body || {};
    if (!title) {
      return res.status(400).json({ message: "Title is required." });
    }
    const imageUrl = req.file && req.file.path ? req.file.path : image;
    const created = await prisma.short.create({
      data: { title, image: imageUrl || "", reactions: defaultReactions() },
    });
    res.status(201).json(withMongoId(created));
  } catch (err) {
    res.status(500).json({ message: "Failed to create short." });
  }
};

const deleteShort = async (req, res) => {
  try {
    const deleted = await prisma.short.findUnique({ where: { id: req.params.id } });
    if (!deleted) {
      return res.status(404).json({ message: "Short not found." });
    }
    await prisma.short.delete({ where: { id: req.params.id } });
    return res.json({ message: "Short deleted." });
  } catch (err) {
    return res.status(400).json({ message: "Invalid short id." });
  }
};

module.exports = { listShorts, createShort, deleteShort };
