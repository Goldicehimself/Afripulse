const multer = require("multer");
const cloudinaryStorage = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const BASE_FOLDER = "afripulse";

const createUploader = (folder, fieldName = "image") => {
  const storage = cloudinaryStorage({
    cloudinary,
    params: (req, file) => {
      const safeName = (file.originalname || "file").replace(
        /[^a-zA-Z0-9._-]/g,
        "-"
      );
      return {
        folder: `${BASE_FOLDER}/${folder}`,
        allowed_formats: ["jpg", "png", "jpeg", "webp"],
        public_id: `${Date.now()}-${safeName}`,
      };
    },
  });

  const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 },
  });

  const optionalUpload = (req, res, next) => {
    if (req.is("multipart/form-data")) {
      return upload.single(fieldName)(req, res, next);
    }
    return next();
  };

  return { upload, optionalUpload };
};

const { upload, optionalUpload } = createUploader("posts", "image");

module.exports = {
  upload,
  optionalUpload,
  createUploader,
};
