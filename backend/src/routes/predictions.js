const express = require("express");
const {
  listPredictions,
  createPrediction,
  leaderboard,
} = require("../controllers/predictionsController");

const { requireAuth } = require("../middleware/auth");
const router = express.Router();

router.get("/", listPredictions);
router.get("/leaderboard", leaderboard);
router.post("/", requireAuth, createPrediction);

module.exports = router;
