const prisma = require("../config/prisma");
const slugify = require("../utils/slugify");
const { withMongoIds } = require("../utils/dbShape");

const NEWSDATA_ENDPOINT = "https://newsdata.io/api/1/latest";

const feedConfigs = {
  "nigeria-news": {
    label: "Nigeria News",
    category: "news",
    params: {
      country: "ng",
      language: "en",
      q: "Nigeria",
    },
  },
  "nigeria-politics": {
    label: "Nigeria Politics",
    category: "news",
    params: {
      country: "ng",
      language: "en",
      category: "politics",
      q: "Nigeria politics",
    },
  },
  entertainment: {
    label: "Entertainment",
    category: "entertainment",
    params: {
      country: "ng",
      language: "en",
      category: "entertainment",
      q: "Nollywood OR Afrobeats OR Nigerian entertainment",
    },
  },
  "africa-gist": {
    label: "Africa Gist",
    category: "entertainment",
    params: {
      country: "ng,gh,za,ke",
      language: "en",
      q: "African celebrities OR African music OR Nollywood OR Afrobeats",
    },
  },
  "global-sports": {
    label: "Global Sports",
    category: "sports",
    params: {
      language: "en",
      category: "sports",
      q: "football OR FIFA OR Champions League OR Premier League OR transfer news",
    },
  },
};

const getFeedConfig = (feedKey) => feedConfigs[feedKey];

const listFeedKeys = () =>
  Object.entries(feedConfigs).map(([key, config]) => ({
    key,
    label: config.label,
    category: config.category,
  }));

const buildUrl = (params) => {
  const apiKey = process.env.NEWSDATA_API_KEY;
  if (!apiKey || apiKey === "your_newsdata_api_key_here") {
    throw new Error("NEWSDATA_API_KEY is not set in the environment");
  }

  const searchParams = new URLSearchParams({
    apikey: apiKey,
    size: process.env.NEWSDATA_PAGE_SIZE || "10",
    ...params,
  });

  return `${NEWSDATA_ENDPOINT}?${searchParams.toString()}`;
};

const normalizeDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const normalizeImageUrl = (value) => {
  if (!value) return "";
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    if (value.includes("s3://")) return "";
    return value;
  } catch {
    return "";
  }
};

const uniqueSlug = (title, externalId) => {
  const base = slugify(title || "external-news");
  const suffix = externalId ? String(externalId).slice(0, 8).toLowerCase() : Date.now();
  return `${base}-${suffix}`;
};

const normalizeArticle = (item, feedKey, config) => {
  const externalId = item.article_id || item.link;
  const title = item.title || "Untitled story";
  const sourceUrl = item.link || item.source_url || "";
  return {
    externalId,
    feedKey,
    title,
    slug: uniqueSlug(title, externalId),
    summary: item.description || item.content || "",
    content: item.content || item.description || "",
    category: config.category,
    tags: Array.isArray(item.keywords) ? item.keywords.filter(Boolean) : [],
    authorName: Array.isArray(item.creator)
      ? item.creator.filter(Boolean).join(", ")
      : item.creator || "",
    status: "published",
    publishedAt: normalizeDate(item.pubDate) || new Date(),
    coverImageUrl: normalizeImageUrl(item.image_url),
    sourceName: item.source_name || "",
    sourceUrl,
  };
};

const fetchFeedFromNewsData = async (feedKey) => {
  const config = getFeedConfig(feedKey);
  if (!config) {
    const error = new Error("Unknown feed key");
    error.statusCode = 404;
    throw error;
  }

  const response = await fetch(buildUrl(config.params));
  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload.status === "error") {
    const message = payload.results?.message || payload.message || "NewsData request failed";
    const error = new Error(message);
    error.statusCode = response.status || 502;
    throw error;
  }

  return Array.isArray(payload.results) ? payload.results : [];
};

const saveFeedArticles = async (feedKey, items) => {
  const config = getFeedConfig(feedKey);
  const saved = [];

  for (const item of items) {
    const data = normalizeArticle(item, feedKey, config);
    if (!data.externalId || !data.title || !data.sourceUrl) continue;

    const article = await prisma.article.upsert({
      where: { externalId: data.externalId },
      update: {
        feedKey: data.feedKey,
        title: data.title,
        summary: data.summary,
        content: data.content,
        category: data.category,
        tags: data.tags,
        authorName: data.authorName,
        status: data.status,
        publishedAt: data.publishedAt,
        coverImageUrl: data.coverImageUrl,
        sourceName: data.sourceName,
        sourceUrl: data.sourceUrl,
      },
      create: data,
    });
    saved.push(article);
  }

  return saved;
};

const refreshFeed = async (feedKey) => {
  const items = await fetchFeedFromNewsData(feedKey);
  return saveFeedArticles(feedKey, items);
};

const refreshAllFeeds = async () => {
  const result = {};
  for (const feedKey of Object.keys(feedConfigs)) {
    result[feedKey] = await refreshFeed(feedKey);
  }
  return result;
};

const listCachedFeed = async (feedKey, limit = 20) => {
  const config = getFeedConfig(feedKey);
  if (!config) {
    const error = new Error("Unknown feed key");
    error.statusCode = 404;
    throw error;
  }

  const items = await prisma.article.findMany({
    where: {
      feedKey,
      status: "published",
    },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: limit,
  });

  return withMongoIds(items);
};

module.exports = {
  listFeedKeys,
  listCachedFeed,
  refreshFeed,
  refreshAllFeeds,
};
