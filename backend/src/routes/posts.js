const express = require("express");
const {
  listPosts,
  getTrendingPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  reactToPost,
} = require("../controllers/postController");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const { optionalUpload } = require("../middleware/upload");

const router = express.Router();

router.get("/", listPosts);
router.get("/trending", getTrendingPosts);
router.get("/:id", getPostById);
router.post("/", requireAuth, requireAdmin, optionalUpload, createPost);
router.put("/:id", requireAuth, requireAdmin, optionalUpload, updatePost);
router.delete("/:id", requireAuth, requireAdmin, deletePost);
router.post("/:id/react", reactToPost);

module.exports = router;
