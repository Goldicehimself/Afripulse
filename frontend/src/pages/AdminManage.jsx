import { useEffect, useState } from "react";
import { fetchPosts, deletePost, updatePost } from "../api/posts";
import { fetchShorts, deleteShort } from "../api/shorts";
import { fetchMatches, deleteMatch } from "../api/matches";
import { uploadImage } from "../api/cloudinary";
import useAuthStore from "../store/useAuthStore";

const tabs = ["Posts", "Shorts", "Matches"];
const categories = ["news", "sports", "entertainment", "music"];

const isValidImageUrl = (value) => {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

function AdminManage() {
  const token = useAuthStore((state) => state.token);
  const [activeTab, setActiveTab] = useState("Posts");
  const [posts, setPosts] = useState([]);
  const [shorts, setShorts] = useState([]);
  const [matches, setMatches] = useState([]);
  const [editingPostId, setEditingPostId] = useState("");
  const [postForm, setPostForm] = useState({
    title: "",
    content: "",
    category: "news",
    image: "",
  });
  const [postFile, setPostFile] = useState(null);
  const [postPreview, setPostPreview] = useState("");
  const [savingPost, setSavingPost] = useState(false);
  const [uploadingPost, setUploadingPost] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    Promise.all([
      fetchPosts({ page: 1, limit: 20 }),
      fetchShorts(20),
      fetchMatches({ page: 1, limit: 20 }),
    ])
      .then(([postData, shortData, matchData]) => {
        if (!active) return;
        setPosts(postData.items || []);
        setShorts(shortData.items || []);
        setMatches(matchData.items || []);
      })
      .catch(() => {
        if (!active) return;
        setError("Failed to load admin data.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleDeletePost = async (id) => {
    setError("");
    try {
      await deletePost(id);
      setPosts((prev) => prev.filter((item) => item._id !== id));
    } catch {
      setError("Failed to delete post.");
    }
  };

  const startEditPost = (post) => {
    setError("");
    setEditingPostId(post._id);
    setPostForm({
      title: post.title || "",
      content: post.content || "",
      category: post.category || "news",
      image: post.image || "",
    });
    setPostFile(null);
    setPostPreview("");
    setUploadProgress(0);
  };

  const cancelEditPost = () => {
    setEditingPostId("");
    setPostFile(null);
    setPostPreview("");
    setUploadProgress(0);
  };

  const onPostFormChange = (event) => {
    const { name, value } = event.target;
    setPostForm((prev) => ({ ...prev, [name]: value }));
  };

  const onPostFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    if (postPreview) URL.revokeObjectURL(postPreview);
    setPostFile(file);
    setPostPreview(file ? URL.createObjectURL(file) : "");
    setUploadProgress(0);
  };

  const handleUploadPostImage = async () => {
    if (!postFile) return "";
    if (postFile.size > 2 * 1024 * 1024) {
      setError("Image too large. Max size is 2MB.");
      return "";
    }

    setError("");
    setUploadingPost(true);
    setUploadProgress(0);
    try {
      const result = await uploadImage(postFile, {
        folder: "afripulse/posts",
        publicId: `post-${Date.now()}`,
        onProgress: setUploadProgress,
      });
      const url = result.secure_url || "";
      setPostForm((prev) => ({ ...prev, image: url }));
      return url;
    } catch {
      setError("Image upload failed. Check Cloudinary settings.");
      return "";
    } finally {
      setUploadingPost(false);
    }
  };

  const handleSavePost = async (event) => {
    event.preventDefault();
    let image = postForm.image;
    if (postFile) {
      image = await handleUploadPostImage();
      if (!image) return;
    }
    if (!isValidImageUrl(image)) {
      setError("Image URL must be a valid http/https link.");
      return;
    }

    setSavingPost(true);
    setError("");
    try {
      const updated = await updatePost(editingPostId, { ...postForm, image });
      setPosts((prev) =>
        prev.map((item) => (item._id === updated._id ? updated : item))
      );
      cancelEditPost();
    } catch {
      setError("Failed to update post.");
    } finally {
      setSavingPost(false);
    }
  };

  const handleDeleteShort = async (id) => {
    setError("");
    try {
      await deleteShort(id);
      setShorts((prev) => prev.filter((item) => item._id !== id));
    } catch {
      setError("Failed to delete short.");
    }
  };

  const handleDeleteMatch = async (id) => {
    setError("");
    try {
      await deleteMatch(id);
      setMatches((prev) => prev.filter((item) => item._id !== id));
    } catch {
      setError("Failed to delete match.");
    }
  };

  if (!token) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500">
        You must be logged in to manage content.
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-5xl space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Manage Content</h1>
        <p className="text-sm text-slate-600">
          Delete posts, shorts, and matches.
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

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500">
          Loading content...
        </div>
      ) : (
        <>
          {activeTab === "Posts" && (
            <div className="space-y-3">
              {posts.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500">
                  No posts available.
                </div>
              ) : (
                posts.map((post) => (
                  <div
                    key={post._id}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        {post.title}
                      </p>
                      <p className="text-xs text-slate-500">{post.category}</p>
                      {post.image && (
                        <p className="text-xs text-slate-500">Has image</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEditPost(post)}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePost(post._id)}
                        className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700"
                      >
                        Delete
                      </button>
                    </div>
                    {editingPostId === post._id && (
                      <form
                        className="w-full space-y-3 border-t border-slate-200 pt-4"
                        onSubmit={handleSavePost}
                      >
                        <div className="grid gap-3 md:grid-cols-2">
                          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Title
                            <input
                              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal normal-case tracking-normal text-slate-900"
                              name="title"
                              value={postForm.title}
                              onChange={onPostFormChange}
                              required
                            />
                          </label>
                          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Category
                            <select
                              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal normal-case tracking-normal text-slate-900"
                              name="category"
                              value={postForm.category}
                              onChange={onPostFormChange}
                              required
                            >
                              {categories.map((category) => (
                                <option key={category} value={category}>
                                  {category}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>
                        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Image URL
                          <input
                            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal normal-case tracking-normal text-slate-900"
                            type="url"
                            name="image"
                            value={postForm.image}
                            onChange={onPostFormChange}
                            placeholder="https://..."
                          />
                        </label>
                        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Upload image
                          <input
                            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal normal-case tracking-normal text-slate-900"
                            type="file"
                            accept="image/*"
                            onChange={onPostFileChange}
                          />
                        </label>
                        {uploadingPost && (
                          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                            <div
                              className="h-2 rounded-full bg-emerald-500 transition-all"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                        )}
                        {(postPreview || postForm.image) && (
                          <img
                            src={postPreview || postForm.image}
                            alt="Post preview"
                            className="h-40 w-full rounded-lg object-cover"
                          />
                        )}
                        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Content
                          <textarea
                            className="mt-2 min-h-32 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal normal-case tracking-normal text-slate-900"
                            name="content"
                            value={postForm.content}
                            onChange={onPostFormChange}
                            required
                          />
                        </label>
                        <div className="flex flex-wrap justify-end gap-2">
                          <button
                            type="button"
                            onClick={cancelEditPost}
                            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={savingPost || uploadingPost}
                            className="rounded-full bg-black px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
                          >
                            {savingPost || uploadingPost ? "Saving..." : "Save"}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "Shorts" && (
            <div className="space-y-3">
              {shorts.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500">
                  No shorts available.
                </div>
              ) : (
                shorts.map((short) => (
                  <div
                    key={short._id}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        {short.title}
                      </p>
                      {short.image && (
                        <p className="text-xs text-slate-500">Has image</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteShort(short._id)}
                      className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700"
                    >
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "Matches" && (
            <div className="space-y-3">
              {matches.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500">
                  No matches available.
                </div>
              ) : (
                matches.map((match) => (
                  <div
                    key={match._id}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        {match.home?.name} vs {match.away?.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {match.competition}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteMatch(match._id)}
                      className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700"
                    >
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default AdminManage;
