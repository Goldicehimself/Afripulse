const Post = require("../models/Post");

const listPosts = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit || "10", 10), 1),
      50
    );
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.category) {
      filter.category = req.query.category;
    }
    if (req.query.q) {
      const term = String(req.query.q).trim();
      if (term) {
        const pattern = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        filter.$or = [{ title: pattern }, { content: pattern }];
      }
    }

    const [items, total] = await Promise.all([
      Post.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Post.countDocuments(filter),
    ]);

    res.json({
      items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch posts." });
  }
};

const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }
    res.json(post);
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
    const created = await Post.create({
      title,
      content,
      category,
      image: imageUrl || "",
    });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ message: "Failed to create post." });
  }
};

const deletePost = async (req, res) => {
  try {
    const deleted = await Post.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Post not found." });
    }
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

    const update = { $inc: { [`reactions.${type}`]: 1 } };
    const post = await Post.findByIdAndUpdate(req.params.id, update, {
      new: true,
    });
    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }
    res.json(post);
  } catch (err) {
    res.status(400).json({ message: "Invalid post id." });
  }
};

const getTrendingPosts = async (req, res) => {
  try {
    const limit = Math.min(
      Math.max(parseInt(req.query.limit || "7", 10), 1),
      20
    );
    const items = await Post.aggregate([
      {
        $addFields: {
          reactionScore: {
            $add: [
              { $ifNull: ["$reactions.fire", 0] },
              { $ifNull: ["$reactions.cap", 0] },
              { $ifNull: ["$reactions.brain", 0] },
              { $ifNull: ["$reactions.angry", 0] },
            ],
          },
        },
      },
      { $sort: { reactionScore: -1, createdAt: -1 } },
      { $limit: limit },
      {
        $project: {
          title: 1,
          category: 1,
          reactions: 1,
          createdAt: 1,
        },
      },
    ]);

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
  deletePost,
  reactToPost,
};
