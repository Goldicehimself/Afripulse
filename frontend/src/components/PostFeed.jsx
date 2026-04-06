import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchPosts, reactToPost } from "../api/posts";
import PostCard from "./PostCard";

const categories = [
  { key: "all", label: "All" },
  { key: "news", label: "News" },
  { key: "sports", label: "Sports" },
  { key: "entertainment", label: "Entertainment" },
  { key: "music", label: "Music" },
];

function PostFeed({ fixedCategory, title, subtitle, showFilters = false }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [pageInfo, setPageInfo] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [reactingId, setReactingId] = useState(null);
  const [error, setError] = useState("");

  const category = useMemo(() => {
    if (fixedCategory) return fixedCategory;
    return searchParams.get("category") || "all";
  }, [fixedCategory, searchParams]);

  const query = useMemo(() => {
    return searchParams.get("q") || "";
  }, [searchParams]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    fetchPosts({ page: 1, limit: 10, category, query })
      .then((data) => {
        if (!active) return;
        setItems(data.items || []);
        setPageInfo({
          page: data.page || 1,
          totalPages: data.totalPages || 1,
        });
      })
      .catch(() => {
        if (!active) return;
        setError("Failed to load posts. Please try again.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [category, query]);

  const loadMore = async () => {
    if (loadingMore || pageInfo.page >= pageInfo.totalPages) return;
    setLoadingMore(true);
    setError("");
    try {
      const nextPage = pageInfo.page + 1;
      const data = await fetchPosts({ page: nextPage, limit: 10, category, query });
      setItems((prev) => [...prev, ...(data.items || [])]);
      setPageInfo({
        page: data.page || nextPage,
        totalPages: data.totalPages || pageInfo.totalPages,
      });
    } catch {
      setError("Failed to load more posts.");
    } finally {
      setLoadingMore(false);
    }
  };

  const updateParams = (next) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(next).forEach(([key, value]) => {
      if (value === null || value === undefined || value === "") {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });
    setSearchParams(params);
  };

  const handleReact = async (postId, type) => {
    try {
      setReactingId(postId);
      const updated = await reactToPost(postId, type);
      setItems((prev) =>
        prev.map((item) => (item._id === updated._id ? updated : item))
      );
    } catch {
      setError("Reaction failed. Please try again.");
    } finally {
      setReactingId(null);
    }
  };

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        {title ? (
          <h1 className="text-3xl font-semibold">{title}</h1>
        ) : (
          <h1 className="text-3xl font-semibold">AfriPulse Feed</h1>
        )}
        {subtitle ? (
          <p className="text-slate-600">{subtitle}</p>
        ) : (
          <p className="text-slate-600">
            Trending stories across news, sports, and entertainment.
          </p>
        )}
      </header>

      {showFilters && (
        <div className="flex flex-wrap gap-2">
          {categories.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => updateParams({ category: item.key, page: 1 })}
              className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                category === item.key
                  ? "bg-black text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500">
          Loading posts...
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500">
          No posts yet.
        </div>
      ) : (
        <div className="space-y-5">
          {items.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              onReact={handleReact}
              reacting={reactingId === post._id}
            />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          Page {pageInfo.page} of {pageInfo.totalPages}
        </p>
        {pageInfo.page < pageInfo.totalPages ? (
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 disabled:opacity-40"
          >
            {loadingMore ? "Loading..." : "Load more"}
          </button>
        ) : (
          <span className="text-xs text-slate-400">No more posts</span>
        )}
      </div>
    </section>
  );
}

export default PostFeed;
