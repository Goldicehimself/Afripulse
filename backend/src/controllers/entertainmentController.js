const prisma = require("../config/prisma");
const slugify = require("../utils/slugify");
const { withMongoId, withMongoIds } = require("../utils/dbShape");

const listEntertainment = async (req, res) => {
  const items = await prisma.article.findMany({
    where: { category: "entertainment" },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: 20,
  });
  res.json(withMongoIds(items));
};

const createEntertainment = async (req, res) => {
  const payload = { ...req.body, category: "entertainment" };
  if (req.file && req.file.path) {
    payload.coverImageUrl = req.file.path;
  } else if (payload.coverImage) {
    payload.coverImageUrl = payload.coverImage;
  }
  if (!payload.slug && payload.title) {
    payload.slug = slugify(payload.title);
  }
  const created = await prisma.article.create({ data: normalizeArticlePayload(payload) });
  res.status(201).json(withMongoId(created));
};

const normalizeArticlePayload = (payload) => ({
  title: payload.title,
  slug: payload.slug,
  summary: payload.summary || "",
  content: payload.content || "",
  category: payload.category,
  tags: Array.isArray(payload.tags) ? payload.tags : [],
  authorName: payload.authorName || "",
  status: payload.status || "draft",
  publishedAt: payload.publishedAt ? new Date(payload.publishedAt) : null,
  coverImageUrl: payload.coverImageUrl || "",
  sourceName: payload.sourceName || "",
  sourceUrl: payload.sourceUrl || "",
});

module.exports = { listEntertainment, createEntertainment };
