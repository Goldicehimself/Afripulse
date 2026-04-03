const Article = require("../models/Article");
const slugify = require("../utils/slugify");

const listNews = async (req, res) => {
  const items = await Article.find({ category: "news" })
    .sort({ publishedAt: -1, createdAt: -1 })
    .limit(20);
  res.json(items);
};

const createNews = async (req, res) => {
  const payload = { ...req.body, category: "news" };
  if (req.file && req.file.path) {
    payload.coverImageUrl = req.file.path;
  } else if (payload.coverImage) {
    payload.coverImageUrl = payload.coverImage;
  }
  if (!payload.slug && payload.title) {
    payload.slug = slugify(payload.title);
  }
  const created = await Article.create(payload);
  res.status(201).json(created);
};

module.exports = { listNews, createNews };
