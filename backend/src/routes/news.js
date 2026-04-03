const express = require("express");
const { listNews, createNews } = require("../controllers/newsController");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const { createUploader } = require("../middleware/upload");

const router = express.Router();
const { optionalUpload } = createUploader("news", "cover");

router.get("/", listNews);
router.post("/", requireAuth, requireAdmin, optionalUpload, createNews);

module.exports = router;
