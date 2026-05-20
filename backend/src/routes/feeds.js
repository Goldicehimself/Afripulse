const express = require("express");
const {
  listFeeds,
  getFeed,
  refreshOneFeed,
  refreshFeeds,
} = require("../controllers/feedController");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.get("/", listFeeds);
router.get("/:feedKey", getFeed);
router.post("/refresh/all", requireAuth, requireAdmin, refreshFeeds);
router.post("/:feedKey/refresh", requireAuth, requireAdmin, refreshOneFeed);

module.exports = router;
