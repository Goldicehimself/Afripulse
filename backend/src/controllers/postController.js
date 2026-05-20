const prisma = require("../config/prisma");
const { defaultReactions, withMongoId, withMongoIds } = require("../utils/dbShape");

const listPosts = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit || "10", 10), 1),
      50
    );
    const skip = (page - 1) * limit;

    const where = {};
    if (req.query.category) {
      where.category = req.query.category;
    }
    if (req.query.q) {
      const term = String(req.query.q).trim();
      if (term) {
        where.OR = [
          { title: { contains: term, mode: "insensitive" } },
          { content: { contains: term, mode: "insensitive" } },
        ];
      }
    }

    const includeExternal = req.query.includeExternal === "true";
    const [items, total, articles] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.post.count({ where }),
      includeExternal
        ? prisma.article.findMany({
            where: {
              status: "published",
              ...(req.query.category && req.query.category !== "all"
                ? { category: req.query.category }
                : {}),
              ...(req.query.q
                ? {
                    OR: [
                      { title: { contains: String(req.query.q).trim(), mode: "insensitive" } },
                      { summary: { contains: String(req.query.q).trim(), mode: "insensitive" } },
                      { content: { contains: String(req.query.q).trim(), mode: "insensitive" } },
                    ],
                  }
                : {}),
            },
            orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
            skip,
            take: limit,
          })
        : Promise.resolve([]),
    ]);

    const postItems = withMongoIds(items).map((item) => ({ ...item, type: "post" }));
    const articleItems = withMongoIds(articles).map((item) => ({
      ...item,
      type: "article",
      image: item.coverImageUrl || "",
      content: item.summary || item.content || "",
      reactions: defaultReactions(),
    }));
    const responseItems = [...postItems, ...articleItems]
      .sort((a, b) => new Date(b.publishedAt || b.createdAt) - new Date(a.publishedAt || a.createdAt))
      .slice(0, limit);

    res.json({
      items: responseItems,
      page,
      limit,
      total: includeExternal ? total + articles.length : total,
      totalPages: Math.ceil((includeExternal ? total + articles.length : total) / limit),
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch posts." });
  }
};

const getPostById = async (req, res) => {
  try {
    const post = await prisma.post.findUnique({ where: { id: req.params.id } });
    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }
    res.json(withMongoId(post));
  } catch (err) {
    res.status(400).json({ message: "Invalid post id." });
  }
};

const isValidUrl = (value) => {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (err) {
    return false;
  }
};

const createPost = async (req, res) => {
  try {
    const { title, content, category, image } = req.body;
    if (!title || !content || !category) {
      return res.status(400).json({ message: "Missing required fields." });
    }
    const imageUrl = req.file && req.file.path ? req.file.path : image;
    if (imageUrl && !isValidUrl(imageUrl)) {
      return res.status(400).json({ message: "Invalid image URL." });
    }
    const created = await prisma.post.create({
      data: {
      title,
      content,
      category,
      image: imageUrl || "",
      reactions: defaultReactions(),
      },
    });
    res.status(201).json(withMongoId(created));
  } catch (err) {
    res.status(500).json({ message: "Failed to create post." });
  }
};

const updatePost = async (req, res) => {
  try {
    const existing = await prisma.post.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ message: "Post not found." });
    }

    const { title, content, category, image } = req.body;
    const imageUrl = req.file && req.file.path ? req.file.path : image;
    if (imageUrl && !isValidUrl(imageUrl)) {
      return res.status(400).json({ message: "Invalid image URL." });
    }

    const updated = await prisma.post.update({
      where: { id: req.params.id },
      data: {
        title: title || existing.title,
        content: content || existing.content,
        category: category || existing.category,
        image: imageUrl === undefined ? existing.image : imageUrl || "",
      },
    });

    res.json(withMongoId(updated));
  } catch (err) {
    res.status(400).json({ message: "Invalid post id." });
  }
};

const deletePost = async (req, res) => {
  try {
    const deleted = await prisma.post.findUnique({ where: { id: req.params.id } });
    if (!deleted) {
      return res.status(404).json({ message: "Post not found." });
    }
    await prisma.post.delete({ where: { id: req.params.id } });
    res.json({ message: "Post deleted." });
  } catch (err) {
    res.status(400).json({ message: "Invalid post id." });
  }
};

const reactToPost = async (req, res) => {
  try {
    const { type } = req.body;
    const allowed = ["fire", "cap", "brain", "angry"];
    if (!allowed.includes(type)) {
      return res.status(400).json({ message: "Invalid reaction type." });
    }

    const existing = await prisma.post.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ message: "Post not found." });
    }
    const reactions = { ...defaultReactions(), ...(existing.reactions || {}) };
    reactions[type] += 1;
    const post = await prisma.post.update({
      where: { id: req.params.id },
      data: { reactions },
    });
    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }
    res.json(withMongoId(post));
  } catch (err) {
    res.status(400).json({ message: "Invalid post id." });
  }
};

const getTrendingPosts = async (req, res) => {
  try {
    const limit = Math.min(
      Math.max(parseInt(req.query.limit || "12", 10), 1),
      50
    );
    const [posts, articles] = await Promise.all([
      prisma.post.findMany({ orderBy: { createdAt: "desc" }, take: limit }),
      prisma.article.findMany({
        where: { status: "published" },
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        take: limit,
      }),
    ]);

    const postItems = posts.map((post) =>
        withMongoId({
          id: post.id,
          type: "post",
          title: post.title,
          category: post.category,
          reactions: post.reactions,
          sourceUrl: "",
          sourceName: "",
          feedKey: "",
          createdAt: post.createdAt,
        })
    );
    const articleItems = articles.map((article) =>
      withMongoId({
        id: article.id,
        type: "article",
        title: article.title,
        category: article.category,
        reactions: defaultReactions(),
        sourceUrl: article.sourceUrl,
        sourceName: article.sourceName,
        feedKey: article.feedKey,
        createdAt: article.publishedAt || article.createdAt,
      })
    );

    const items = [...postItems, ...articleItems]
      .sort((a, b) => {
        const score = (item) => {
          const reactions = { ...defaultReactions(), ...(item.reactions || {}) };
          return reactions.fire + reactions.cap + reactions.brain + reactions.angry;
        };
        return score(b) - score(a) || new Date(b.createdAt) - new Date(a.createdAt);
      })
      .slice(0, limit);

    res.json({ items });
  } catch (err) {
    res.status(500).json({ message: "Failed to load trending posts." });
  }
};

module.exports = {
  listPosts,
  getTrendingPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  reactToPost,
};
