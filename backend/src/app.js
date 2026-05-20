const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const healthRouter = require("./routes/health");
const authRouter = require("./routes/auth");
const newsRouter = require("./routes/news");
const sportsRouter = require("./routes/sports");
const entertainmentRouter = require("./routes/entertainment");
const feedsRouter = require("./routes/feeds");
const postsRouter = require("./routes/posts");
const matchesRouter = require("./routes/matches");
const shortsRouter = require("./routes/shorts");
const predictionsRouter = require("./routes/predictions");
const profileRouter = require("./routes/profile");

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.use("/api/v1/health", healthRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/news", newsRouter);
app.use("/api/v1/sports", sportsRouter);
app.use("/api/v1/entertainment", entertainmentRouter);
app.use("/api/v1/feeds", feedsRouter);
app.use("/api/v1/posts", postsRouter);
app.use("/api/v1/matches", matchesRouter);
app.use("/api/v1/shorts", shortsRouter);
app.use("/api/v1/predictions", predictionsRouter);
app.use("/api/v1/profile", profileRouter);

app.get("/", (req, res) => {
  res.json({ status: "ok", service: "afripulse-backend" });
});

// Multer error handling (e.g., file too large)
app.use((err, req, res, next) => {
  if (err && err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ message: "Image too large." });
  }
  return next(err);
});

module.exports = app;
