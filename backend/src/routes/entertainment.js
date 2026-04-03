const express = require("express");
const {
  listEntertainment,
  createEntertainment,
} = require("../controllers/entertainmentController");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const { createUploader } = require("../middleware/upload");

const router = express.Router();
const { optionalUpload } = createUploader("entertainment", "cover");

router.get("/", listEntertainment);
router.post("/", requireAuth, requireAdmin, optionalUpload, createEntertainment);

module.exports = router;
