const express = require("express");
const {
  listShorts,
  createShort,
  deleteShort,
} = require("../controllers/shortsController");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const { createUploader } = require("../middleware/upload");

const router = express.Router();
const { optionalUpload } = createUploader("shorts", "image");

router.get("/", listShorts);
router.post("/", requireAuth, requireAdmin, optionalUpload, createShort);
router.delete("/:id", requireAuth, requireAdmin, deleteShort);

module.exports = router;
