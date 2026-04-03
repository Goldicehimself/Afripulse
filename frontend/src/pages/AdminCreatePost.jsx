import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPost } from "../api/posts";
import { createShort } from "../api/shorts";
import { createMatch } from "../api/matches";
import { createNews } from "../api/news";
import { createEntertainment } from "../api/entertainment";
import { uploadImage } from "../api/cloudinary";
import useAuthStore from "../store/useAuthStore";

const categories = ["news", "sports", "entertainment", "music"];
const tabs = ["Post", "News", "Entertainment", "Short", "Match"];

const isValidImageUrl = (value) => {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (err) {
    return false;
  }
};

function AdminCreatePost() {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const [activeTab, setActiveTab] = useState("Post");
  const [postForm, setPostForm] = useState({
    title: "",
    content: "",
    category: "news",
    image: "",
  });
  const [shortForm, setShortForm] = useState({
    title: "",
    image: "",
  });
  const [newsForm, setNewsForm] = useState({
    title: "",
    summary: "",
    content: "",
    authorName: "",
    status: "draft",
    publishedAt: "",
    coverImageUrl: "",
  });
  const [entertainmentForm, setEntertainmentForm] = useState({
    title: "",
    summary: "",
    content: "",
    authorName: "",
    status: "draft",
    publishedAt: "",
    coverImageUrl: "",
  });
  const [matchForm, setMatchForm] = useState({
    competition: "",
    stage: "",
    venue: "",
    status: "LIVE",
    minute: "",
    homeName: "",
    awayName: "",
    homeScore: "0",
    awayScore: "0",
    homeBadgeUrl: "",
    awayBadgeUrl: "",
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState({
    post: false,
    short: false,
    newsCover: false,
    entertainmentCover: false,
    homeBadge: false,
    awayBadge: false,
  });
  const [progress, setProgress] = useState({
    post: 0,
    short: 0,
    newsCover: 0,
    entertainmentCover: 0,
    homeBadge: 0,
    awayBadge: 0,
  });
  const [files, setFiles] = useState({
    post: null,
    short: null,
    newsCover: null,
    entertainmentCover: null,
    homeBadge: null,
    awayBadge: null,
  });
  const [previews, setPreviews] = useState({
    post: "",
    short: "",
    newsCover: "",
    entertainmentCover: "",
    homeBadge: "",
    awayBadge: "",
  });
  const [error, setError] = useState("");

  const postImageValid = useMemo(
    () => isValidImageUrl(postForm.image),
    [postForm.image]
  );
  const shortImageValid = useMemo(
    () => isValidImageUrl(shortForm.image),
    [shortForm.image]
  );
  const matchBadgeValid = useMemo(
    () => isValidImageUrl(matchForm.homeBadgeUrl) &&
      isValidImageUrl(matchForm.awayBadgeUrl),
    [matchForm.homeBadgeUrl, matchForm.awayBadgeUrl]
  );

  const onPostChange = (event) => {
    const { name, value } = event.target;
    setPostForm((prev) => ({ ...prev, [name]: value }));
  };

  const onShortChange = (event) => {
    const { name, value } = event.target;
    setShortForm((prev) => ({ ...prev, [name]: value }));
  };

  const onNewsChange = (event) => {
    const { name, value } = event.target;
    setNewsForm((prev) => ({ ...prev, [name]: value }));
  };

  const onEntertainmentChange = (event) => {
    const { name, value } = event.target;
    setEntertainmentForm((prev) => ({ ...prev, [name]: value }));
  };

  const onMatchChange = (event) => {
    const { name, value } = event.target;
    setMatchForm((prev) => ({ ...prev, [name]: value }));
  };

  const submitPost = async (event) => {
    event.preventDefault();
    if (!postImageValid) {
      setError("Image URL must be a valid http/https link.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const created = await createPost(postForm);
      navigate(`/posts/${created._id}`);
    } catch (err) {
      setError("Failed to create post. Check your login.");
    } finally {
      setLoading(false);
    }
  };

  const setPreview = (field, file) => {
    setFiles((prev) => ({ ...prev, [field]: file || null }));
    setPreviews((prev) => {
      if (prev[field]) URL.revokeObjectURL(prev[field]);
      return { ...prev, [field]: file ? URL.createObjectURL(file) : "" };
    });
    setProgress((prev) => ({ ...prev, [field]: 0 }));
  };

  const handleUpload = async (field, fileOverride) => {
    const file = fileOverride || files[field];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("Image too large. Max size is 2MB.");
      return;
    }
    setError("");
    setProgress((prev) => ({ ...prev, [field]: 0 }));
    setUploading((prev) => ({ ...prev, [field]: true }));
    const folderMap = {
      post: "afripulse/posts",
      short: "afripulse/shorts",
      newsCover: "afripulse/news",
      entertainmentCover: "afripulse/entertainment",
      homeBadge: "afripulse/badges",
      awayBadge: "afripulse/badges",
    };
    const publicIdMap = {
      post: `post-${Date.now()}`,
      short: `short-${Date.now()}`,
      newsCover: `news-${Date.now()}`,
      entertainmentCover: `ent-${Date.now()}`,
      homeBadge: `badge-home-${Date.now()}`,
      awayBadge: `badge-away-${Date.now()}`,
    };
    try {
      const result = await uploadImage(file, {
        onProgress: (value) =>
          setProgress((prev) => ({ ...prev, [field]: value })),
        folder: folderMap[field],
        publicId: publicIdMap[field],
      });
      const url = result.secure_url || "";
      if (field === "post") {
        setPostForm((prev) => ({ ...prev, image: url }));
      } else if (field === "short") {
        setShortForm((prev) => ({ ...prev, image: url }));
      } else if (field === "newsCover") {
        setNewsForm((prev) => ({ ...prev, coverImageUrl: url }));
      } else if (field === "entertainmentCover") {
        setEntertainmentForm((prev) => ({ ...prev, coverImageUrl: url }));
      } else if (field === "homeBadge") {
        setMatchForm((prev) => ({ ...prev, homeBadgeUrl: url }));
      } else if (field === "awayBadge") {
        setMatchForm((prev) => ({ ...prev, awayBadgeUrl: url }));
      }
    } catch (err) {
      setError("Image upload failed. Check Cloudinary settings.");
    } finally {
      setUploading((prev) => ({ ...prev, [field]: false }));
    }
  };

  const submitShort = async (event) => {
    event.preventDefault();
    if (!shortImageValid) {
      setError("Short image URL must be a valid http/https link.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await createShort(shortForm);
      setShortForm({ title: "", image: "" });
    } catch (err) {
      setError("Failed to create short. Check your login.");
    } finally {
      setLoading(false);
    }
  };

  const submitNews = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload = {
        ...newsForm,
        publishedAt: newsForm.publishedAt || undefined,
      };
      await createNews(payload);
      setNewsForm({
        title: "",
        summary: "",
        content: "",
        authorName: "",
        status: "draft",
        publishedAt: "",
        coverImageUrl: "",
      });
    } catch (err) {
      setError("Failed to create news. Check your login.");
    } finally {
      setLoading(false);
    }
  };

  const submitEntertainment = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload = {
        ...entertainmentForm,
        publishedAt: entertainmentForm.publishedAt || undefined,
      };
      await createEntertainment(payload);
      setEntertainmentForm({
        title: "",
        summary: "",
        content: "",
        authorName: "",
        status: "draft",
        publishedAt: "",
        coverImageUrl: "",
      });
    } catch (err) {
      setError("Failed to create entertainment. Check your login.");
    } finally {
      setLoading(false);
    }
  };

  const submitMatch = async (event) => {
    event.preventDefault();
    if (!matchBadgeValid) {
      setError("Badge URLs must be valid http/https links.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await createMatch({
        competition: matchForm.competition,
        stage: matchForm.stage,
        venue: matchForm.venue,
        status: matchForm.status,
        minute: parseInt(matchForm.minute || "0", 10),
        home: {
          name: matchForm.homeName,
          score: parseInt(matchForm.homeScore || "0", 10),
          badgeUrl: matchForm.homeBadgeUrl,
        },
        away: {
          name: matchForm.awayName,
          score: parseInt(matchForm.awayScore || "0", 10),
          badgeUrl: matchForm.awayBadgeUrl,
        },
      });
      setMatchForm({
        competition: "",
        stage: "",
        venue: "",
        status: "LIVE",
        minute: "",
        homeName: "",
        awayName: "",
        homeScore: "0",
        awayScore: "0",
        homeBadgeUrl: "",
        awayBadgeUrl: "",
      });
    } catch (err) {
      setError("Failed to create match. Check your login.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500">
        You must be logged in to create content.
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Admin Studio</h1>
        <p className="text-sm text-slate-600">
          Create posts, shorts, and matches from one place.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${
              activeTab === tab
                ? "bg-black text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {activeTab === "Post" && (
        <form className="space-y-4" onSubmit={submitPost}>
          <label className="block text-sm font-medium text-slate-700">
            Title
            <input
              className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
              type="text"
              name="title"
              value={postForm.title}
              onChange={onPostChange}
              required
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Category
            <select
              className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
              name="category"
              value={postForm.category}
              onChange={onPostChange}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Image URL (optional)
            <input
              className={`mt-2 w-full rounded-lg border px-4 py-2 text-sm ${
                postImageValid ? "border-slate-200" : "border-rose-300"
              }`}
              type="url"
              name="image"
              value={postForm.image}
              onChange={onPostChange}
              placeholder="https://..."
            />
            {!postImageValid && (
              <span className="mt-1 block text-xs text-rose-600">
                Enter a valid http/https URL.
              </span>
            )}
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Upload image (optional)
            <input
              className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                setPreview("post", file);
              }}
            />
            <span className="mt-1 block text-xs text-slate-500">
              Select an image to preview, then click Upload.
            </span>
          </label>
          <button
            type="button"
            onClick={() => handleUpload("post")}
            disabled={!files.post || uploading.post}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploading.post ? "Uploading..." : "Upload Image"}
          </button>
          {uploading.post && (
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-2 rounded-full bg-emerald-500 transition-all"
                style={{ width: `${progress.post}%` }}
              />
            </div>
          )}
          {previews.post && (
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <img
                src={previews.post}
                alt="Post preview"
                className="h-40 w-full rounded-md object-cover"
              />
            </div>
          )}
          <label className="block text-sm font-medium text-slate-700">
            Content
            <textarea
              className="mt-2 min-h-[180px] w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
              name="content"
              value={postForm.content}
              onChange={onPostChange}
              required
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Publishing..." : "Publish Post"}
          </button>
        </form>
      )}

      {activeTab === "Short" && (
        <form className="space-y-4" onSubmit={submitShort}>
          <label className="block text-sm font-medium text-slate-700">
            Short Title
            <input
              className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
              type="text"
              name="title"
              value={shortForm.title}
              onChange={onShortChange}
              required
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Image URL (optional)
            <input
              className={`mt-2 w-full rounded-lg border px-4 py-2 text-sm ${
                shortImageValid ? "border-slate-200" : "border-rose-300"
              }`}
              type="url"
              name="image"
              value={shortForm.image}
              onChange={onShortChange}
              placeholder="https://..."
            />
            {!shortImageValid && (
              <span className="mt-1 block text-xs text-rose-600">
                Enter a valid http/https URL.
              </span>
            )}
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Upload image (optional)
            <input
              className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                setPreview("short", file);
              }}
            />
            <span className="mt-1 block text-xs text-slate-500">
              Select an image to preview, then click Upload.
            </span>
          </label>
          <button
            type="button"
            onClick={() => handleUpload("short")}
            disabled={!files.short || uploading.short}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploading.short ? "Uploading..." : "Upload Image"}
          </button>
          {uploading.short && (
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-2 rounded-full bg-emerald-500 transition-all"
                style={{ width: `${progress.short}%` }}
              />
            </div>
          )}
          {previews.short && (
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <img
                src={previews.short}
                alt="Short preview"
                className="h-40 w-full rounded-md object-cover"
              />
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Publishing..." : "Publish Short"}
          </button>
        </form>
      )}

      {activeTab === "News" && (
        <form className="space-y-4" onSubmit={submitNews}>
          <label className="block text-sm font-medium text-slate-700">
            Title
            <input
              className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
              type="text"
              name="title"
              value={newsForm.title}
              onChange={onNewsChange}
              required
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Summary
            <textarea
              className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
              rows="3"
              name="summary"
              value={newsForm.summary}
              onChange={onNewsChange}
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Cover image URL (optional)
            <input
              className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
              type="url"
              name="coverImageUrl"
              value={newsForm.coverImageUrl}
              onChange={onNewsChange}
              placeholder="https://..."
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Upload cover (optional)
            <input
              className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                setPreview("newsCover", file);
              }}
            />
            <span className="mt-1 block text-xs text-slate-500">
              Select an image to preview, then click Upload.
            </span>
          </label>
          <button
            type="button"
            onClick={() => handleUpload("newsCover")}
            disabled={!files.newsCover || uploading.newsCover}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploading.newsCover ? "Uploading..." : "Upload Cover"}
          </button>
          {uploading.newsCover && (
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-2 rounded-full bg-emerald-500 transition-all"
                style={{ width: `${progress.newsCover}%` }}
              />
            </div>
          )}
          {previews.newsCover && (
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <img
                src={previews.newsCover}
                alt="News cover preview"
                className="h-40 w-full rounded-md object-cover"
              />
            </div>
          )}
          <label className="block text-sm font-medium text-slate-700">
            Content
            <textarea
              className="mt-2 min-h-[180px] w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
              name="content"
              value={newsForm.content}
              onChange={onNewsChange}
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Author name
              <input
                className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
                type="text"
                name="authorName"
                value={newsForm.authorName}
                onChange={onNewsChange}
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Status
              <select
                className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
                name="status"
                value={newsForm.status}
                onChange={onNewsChange}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </label>
          </div>
          <label className="block text-sm font-medium text-slate-700">
            Published at (optional)
            <input
              className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
              type="datetime-local"
              name="publishedAt"
              value={newsForm.publishedAt}
              onChange={onNewsChange}
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Saving..." : "Publish News"}
          </button>
        </form>
      )}

      {activeTab === "Entertainment" && (
        <form className="space-y-4" onSubmit={submitEntertainment}>
          <label className="block text-sm font-medium text-slate-700">
            Title
            <input
              className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
              type="text"
              name="title"
              value={entertainmentForm.title}
              onChange={onEntertainmentChange}
              required
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Summary
            <textarea
              className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
              rows="3"
              name="summary"
              value={entertainmentForm.summary}
              onChange={onEntertainmentChange}
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Cover image URL (optional)
            <input
              className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
              type="url"
              name="coverImageUrl"
              value={entertainmentForm.coverImageUrl}
              onChange={onEntertainmentChange}
              placeholder="https://..."
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Upload cover (optional)
            <input
              className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                setPreview("entertainmentCover", file);
              }}
            />
            <span className="mt-1 block text-xs text-slate-500">
              Select an image to preview, then click Upload.
            </span>
          </label>
          <button
            type="button"
            onClick={() => handleUpload("entertainmentCover")}
            disabled={!files.entertainmentCover || uploading.entertainmentCover}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploading.entertainmentCover ? "Uploading..." : "Upload Cover"}
          </button>
          {uploading.entertainmentCover && (
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-2 rounded-full bg-emerald-500 transition-all"
                style={{ width: `${progress.entertainmentCover}%` }}
              />
            </div>
          )}
          {previews.entertainmentCover && (
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <img
                src={previews.entertainmentCover}
                alt="Entertainment cover preview"
                className="h-40 w-full rounded-md object-cover"
              />
            </div>
          )}
          <label className="block text-sm font-medium text-slate-700">
            Content
            <textarea
              className="mt-2 min-h-[180px] w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
              name="content"
              value={entertainmentForm.content}
              onChange={onEntertainmentChange}
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Author name
              <input
                className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
                type="text"
                name="authorName"
                value={entertainmentForm.authorName}
                onChange={onEntertainmentChange}
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Status
              <select
                className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
                name="status"
                value={entertainmentForm.status}
                onChange={onEntertainmentChange}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </label>
          </div>
          <label className="block text-sm font-medium text-slate-700">
            Published at (optional)
            <input
              className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
              type="datetime-local"
              name="publishedAt"
              value={entertainmentForm.publishedAt}
              onChange={onEntertainmentChange}
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Saving..." : "Publish Entertainment"}
          </button>
        </form>
      )}

      {activeTab === "Match" && (
        <form className="space-y-4" onSubmit={submitMatch}>
          <label className="block text-sm font-medium text-slate-700">
            Competition
            <input
              className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
              type="text"
              name="competition"
              value={matchForm.competition}
              onChange={onMatchChange}
              required
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Stage (optional)
              <input
                className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
                type="text"
                name="stage"
                value={matchForm.stage}
                onChange={onMatchChange}
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Venue (optional)
              <input
                className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
                type="text"
                name="venue"
                value={matchForm.venue}
                onChange={onMatchChange}
              />
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Status
              <input
                className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
                type="text"
                name="status"
                value={matchForm.status}
                onChange={onMatchChange}
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Minute
              <input
                className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
                type="number"
                name="minute"
                value={matchForm.minute}
                onChange={onMatchChange}
                min="0"
              />
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Home Team
              <input
                className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
                type="text"
                name="homeName"
                value={matchForm.homeName}
                onChange={onMatchChange}
                required
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Away Team
              <input
                className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
                type="text"
                name="awayName"
                value={matchForm.awayName}
                onChange={onMatchChange}
                required
              />
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Home Score
              <input
                className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
                type="number"
                name="homeScore"
                value={matchForm.homeScore}
                onChange={onMatchChange}
                min="0"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Away Score
              <input
                className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
                type="number"
                name="awayScore"
                value={matchForm.awayScore}
                onChange={onMatchChange}
                min="0"
              />
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Home Badge URL (optional)
              <input
                className={`mt-2 w-full rounded-lg border px-4 py-2 text-sm ${
                  matchBadgeValid ? "border-slate-200" : "border-rose-300"
                }`}
                type="url"
                name="homeBadgeUrl"
                value={matchForm.homeBadgeUrl}
                onChange={onMatchChange}
                placeholder="https://..."
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Away Badge URL (optional)
              <input
                className={`mt-2 w-full rounded-lg border px-4 py-2 text-sm ${
                  matchBadgeValid ? "border-slate-200" : "border-rose-300"
                }`}
                type="url"
                name="awayBadgeUrl"
                value={matchForm.awayBadgeUrl}
                onChange={onMatchChange}
                placeholder="https://..."
              />
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Upload Home Badge (optional)
              <input
                className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  setPreview("homeBadge", file);
                }}
              />
              <span className="mt-1 block text-xs text-slate-500">
                Select an image to preview, then click Upload.
              </span>
              <button
                type="button"
                onClick={() => handleUpload("homeBadge")}
                disabled={!files.homeBadge || uploading.homeBadge}
                className="mt-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploading.homeBadge ? "Uploading..." : "Upload Badge"}
              </button>
              {uploading.homeBadge && (
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-2 rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${progress.homeBadge}%` }}
                  />
                </div>
              )}
              {previews.homeBadge && (
                <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
                  <img
                    src={previews.homeBadge}
                    alt="Home badge preview"
                    className="h-24 w-24 rounded-full object-cover"
                  />
                </div>
              )}
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Upload Away Badge (optional)
              <input
                className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  setPreview("awayBadge", file);
                }}
              />
              <span className="mt-1 block text-xs text-slate-500">
                Select an image to preview, then click Upload.
              </span>
              <button
                type="button"
                onClick={() => handleUpload("awayBadge")}
                disabled={!files.awayBadge || uploading.awayBadge}
                className="mt-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploading.awayBadge ? "Uploading..." : "Upload Badge"}
              </button>
              {uploading.awayBadge && (
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-2 rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${progress.awayBadge}%` }}
                  />
                </div>
              )}
              {previews.awayBadge && (
                <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
                  <img
                    src={previews.awayBadge}
                    alt="Away badge preview"
                    className="h-24 w-24 rounded-full object-cover"
                  />
                </div>
              )}
            </label>
          </div>
          {!matchBadgeValid && (
            <span className="block text-xs text-rose-600">
              Enter valid http/https URLs for badges.
            </span>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Saving..." : "Create Match"}
          </button>
        </form>
      )}
    </section>
  );
}

export default AdminCreatePost;
