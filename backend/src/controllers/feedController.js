const {
  listFeedKeys,
  listCachedFeed,
  refreshFeed,
  refreshAllFeeds,
} = require("../services/newsdataService");
const { withMongoIds } = require("../utils/dbShape");

const listFeeds = (req, res) => {
  res.json({ items: listFeedKeys() });
};

const getFeed = async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit || "20", 10), 1), 50);
    const items = await listCachedFeed(req.params.feedKey, limit);
    res.json({ items });
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message || "Failed to load feed." });
  }
};

const refreshOneFeed = async (req, res) => {
  try {
    const items = await refreshFeed(req.params.feedKey);
    res.json({ items: withMongoIds(items), count: items.length });
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message || "Failed to refresh feed." });
  }
};

const refreshFeeds = async (req, res) => {
  try {
    const result = await refreshAllFeeds();
    const counts = Object.fromEntries(
      Object.entries(result).map(([key, items]) => [key, items.length])
    );
    res.json({ counts });
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message || "Failed to refresh feeds." });
  }
};

module.exports = {
  listFeeds,
  getFeed,
  refreshOneFeed,
  refreshFeeds,
};
