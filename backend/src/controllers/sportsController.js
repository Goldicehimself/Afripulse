const Article = require("../models/Article");
const slugify = require("../utils/slugify");

const listSports = async (req, res) => {
  const items = await Article.find({ category: "sports" })
    .sort({ publishedAt: -1, createdAt: -1 })
    .limit(20);
  res.json(items);
};

const createSports = async (req, res) => {
  const payload = { ...req.body, category: "sports" };
  if (!payload.slug && payload.title) {
    payload.slug = slugify(payload.title);
  }
  const created = await Article.create(payload);
  res.status(201).json(created);
};

module.exports = { listSports, createSports };
