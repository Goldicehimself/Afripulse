const express = require("express");
const {
  listMatches,
  getMatchById,
  createMatch,
  updateMatch,
  deleteMatch,
} = require("../controllers/matchController");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.get("/", listMatches);
router.get("/:id", getMatchById);
router.post("/", requireAuth, requireAdmin, createMatch);
router.put("/:id", requireAuth, requireAdmin, updateMatch);
router.delete("/:id", requireAuth, requireAdmin, deleteMatch);

module.exports = router;
