const express = require("express");
const { getProfile, updateProfile } = require("../controllers/profileController");
const { requireAuth } = require("../middleware/auth");
const { createUploader } = require("../middleware/upload");

const router = express.Router();
const { optionalUpload } = createUploader("avatars", "avatar");

router.get("/", requireAuth, getProfile);
router.put("/", requireAuth, optionalUpload, updateProfile);

module.exports = router;
