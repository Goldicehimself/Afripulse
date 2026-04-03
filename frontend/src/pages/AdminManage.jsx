import { useEffect, useState } from "react";
import { fetchPosts, deletePost } from "../api/posts";
import { fetchShorts, deleteShort } from "../api/shorts";
import { fetchMatches, deleteMatch } from "../api/matches";
import useAuthStore from "../store/useAuthStore";

const tabs = ["Posts", "Shorts", "Matches"];

function AdminManage() {
  const token = useAuthStore((state) => state.token);
  const [activeTab, setActiveTab] = useState("Posts");
  const [posts, setPosts] = useState([]);
  const [shorts, setShorts] = useState([]);
  const [matches, setMatches] = useState([]);
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
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeletePost(post._id)}
                      className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700"
                    >
                      Delete
                    </button>
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
