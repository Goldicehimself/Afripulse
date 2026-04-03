const mongoose = require("mongoose");

const articleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    summary: { type: String, default: "" },
    content: { type: String, default: "" },
    category: {
      type: String,
      enum: ["news", "sports", "entertainment"],
      required: true,
    },
    tags: [{ type: String }],
    authorName: { type: String, default: "" },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    publishedAt: { type: Date },
    coverImageUrl: { type: String, default: "" },
    sourceName: { type: String, default: "" },
    sourceUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Article", articleSchema);
