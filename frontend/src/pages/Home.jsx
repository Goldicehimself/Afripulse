import { useEffect, useState } from "react";
import { Angry, Brain, Flame, GraduationCap } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { fetchPosts, fetchTrending, reactToPost } from "../api/posts";
import SafeImage from "../components/SafeImage";

const categoryClass = {
  news: "bg-sky-500/20 text-sky-300",
  sports: "bg-emerald-500/20 text-emerald-300",
  entertainment: "bg-rose-500/20 text-rose-300",
};

const feedLabels = {
  "nigeria-news": "Nigeria News",
  "nigeria-politics": "Nigeria Politics",
  entertainment: "Entertainment",
  "africa-gist": "Africa Gist",
  "global-sports": "Global Sports",
};

const formatTimeAgo = (value) => {
  if (!value) return "";
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) {
    const minutes = Math.max(1, Math.floor(diff / (1000 * 60)));
    return `${minutes}m ago`;
  }
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

function Home() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [reactingId, setReactingId] = useState(null);
  const [pageInfo, setPageInfo] = useState({ page: 1, totalPages: 1 });
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    Promise.all([
      fetchPosts({ page: 1, limit: 10, query, includeExternal: true }),
      fetchTrending(7),
    ])
      .then(([posts, trendingData]) => {
        if (!active) return;
        setItems(posts.items || []);
        setPageInfo({
          page: posts.page || 1,
          totalPages: posts.totalPages || 1,
        });
        setTrending(trendingData.items || []);
      })
      .catch(() => {
        if (!active) return;
        setError("Failed to load posts.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [query]);

  const loadMore = async () => {
    if (loadingMore || pageInfo.page >= pageInfo.totalPages) return;
    setLoadingMore(true);
    setError("");
    try {
      const nextPage = pageInfo.page + 1;
      const data = await fetchPosts({
        page: nextPage,
        limit: 10,
        query,
        includeExternal: true,
      });
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

  const openItem = (item) => {
    if (item.type === "article" && item.sourceUrl) {
      window.open(item.sourceUrl, "_blank", "noopener,noreferrer");
      return;
    }
    if (item._id) navigate(`/posts/${item._id}`);
  };

  const reactionTotal = (item) =>
    (item.reactions?.fire || 0) +
    (item.reactions?.cap || 0) +
    (item.reactions?.brain || 0) +
    (item.reactions?.angry || 0);

  const itemMeta = (item) =>
    item.type === "article"
      ? item.sourceName || feedLabels[item.feedKey] || "External source"
      : `${reactionTotal(item)} reactions`;

  const topItems = items.slice(0, 2);
  const restItems = items.slice(2);

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">
            Trending Now
          </h2>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="inline-flex h-2 w-2 rounded-full bg-rose-500"></span>
            Live
          </div>
        </div>
        <div className="overflow-hidden py-1 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
          <div className="flex w-max animate-[ticker_28s_linear_infinite] gap-2.5 hover:[animation-play-state:paused]">
            {[...trending, ...trending].map((item, index) => (
              <button
                key={`${item.type || "post"}-${item._id}-${index}`}
                type="button"
                onClick={() => openItem(item)}
                className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-slate-200 shadow-[0_6px_16px_rgba(0,0,0,0.35)] transition hover:-translate-y-0.5 hover:bg-white/10"
              >
                {item.title.length > 20
                  ? `${item.title.slice(0, 20)}...`
                  : item.title}
                <span className="ml-3 text-slate-400">
                  {item.type === "article" ? "News" : reactionTotal(item)}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-8 text-center text-sm text-slate-400">
          Loading posts...
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-8 text-center text-sm text-slate-400">
          No posts yet.
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {topItems.map((item) => (
              <button
                key={`${item.type || "post"}-${item._id}`}
                type="button"
                onClick={() => openItem(item)}
                className="block w-full text-left"
              >
                <article className="ap-card overflow-hidden border border-white/10 bg-gradient-to-r from-white/5 via-white/2 to-transparent shadow-[0_12px_28px_rgba(0,0,0,0.38)]">
                  <div className="flex gap-4 p-3.5">
                    <SafeImage
                      src={item.image}
                      alt={item.title}
                      className="h-20 w-20 rounded-xl object-cover"
                      fallbackClassName="h-20 w-20 rounded-xl bg-white/10"
                    />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span
                          className={`rounded-full px-2 py-1 ${
                            categoryClass[item.category] ||
                            "bg-white/10 text-white"
                          }`}
                        >
                          {item.category}
                        </span>
                        <span>{formatTimeAgo(item.publishedAt || item.createdAt)}</span>
                        {item.type === "article" && (
                          <span>{itemMeta(item)}</span>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold leading-snug text-white md:text-base">
                        {item.title}
                      </h3>
                      {item.type !== "article" ? (
                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.preventDefault();
                            handleReact(item._id, "fire");
                          }}
                          disabled={reactingId === item._id}
                          className="inline-flex items-center gap-1"
                        >
                          <Flame size={14} />
                          {item.reactions?.fire || 0}
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.preventDefault();
                            handleReact(item._id, "cap");
                          }}
                          disabled={reactingId === item._id}
                          className="inline-flex items-center gap-1"
                        >
                          <GraduationCap size={14} />
                          {item.reactions?.cap || 0}
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.preventDefault();
                            handleReact(item._id, "brain");
                          }}
                          disabled={reactingId === item._id}
                          className="inline-flex items-center gap-1"
                        >
                          <Brain size={14} />
                          {item.reactions?.brain || 0}
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.preventDefault();
                            handleReact(item._id, "angry");
                          }}
                          disabled={reactingId === item._id}
                          className="inline-flex items-center gap-1"
                        >
                          <Angry size={14} />
                          {item.reactions?.angry || 0}
                        </button>
                      </div>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-white/10 px-3.5 py-2.5 text-xs text-slate-400">
                    <span>{itemMeta(item)}</span>
                    <span>{item.type === "article" ? "Read from source" : "0 comments"}</span>
                  </div>
                </article>
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {restItems.map((item) => (
              <button
                key={`${item.type || "post"}-${item._id}`}
                type="button"
                onClick={() => openItem(item)}
                className="block w-full text-left"
              >
                <article className="ap-card overflow-hidden border border-white/10 bg-gradient-to-r from-white/5 via-white/2 to-transparent shadow-[0_12px_28px_rgba(0,0,0,0.38)]">
                  <div className="flex gap-4 p-3.5">
                    <SafeImage
                      src={item.image}
                      alt={item.title}
                      className="h-20 w-20 rounded-xl object-cover"
                      fallbackClassName="h-20 w-20 rounded-xl bg-white/10"
                    />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span
                          className={`rounded-full px-2 py-1 ${
                            categoryClass[item.category] ||
                            "bg-white/10 text-white"
                          }`}
                        >
                          {item.category}
                        </span>
                        <span>{formatTimeAgo(item.publishedAt || item.createdAt)}</span>
                        {item.type === "article" && (
                          <span>{itemMeta(item)}</span>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold leading-snug text-white md:text-base">
                        {item.title}
                      </h3>
                      {item.type !== "article" ? (
                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.preventDefault();
                            handleReact(item._id, "fire");
                          }}
                          disabled={reactingId === item._id}
                          className="inline-flex items-center gap-1"
                        >
                          <Flame size={14} />
                          {item.reactions?.fire || 0}
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.preventDefault();
                            handleReact(item._id, "cap");
                          }}
                          disabled={reactingId === item._id}
                          className="inline-flex items-center gap-1"
                        >
                          <GraduationCap size={14} />
                          {item.reactions?.cap || 0}
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.preventDefault();
                            handleReact(item._id, "brain");
                          }}
                          disabled={reactingId === item._id}
                          className="inline-flex items-center gap-1"
                        >
                          <Brain size={14} />
                          {item.reactions?.brain || 0}
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.preventDefault();
                            handleReact(item._id, "angry");
                          }}
                          disabled={reactingId === item._id}
                          className="inline-flex items-center gap-1"
                        >
                          <Angry size={14} />
                          {item.reactions?.angry || 0}
                        </button>
                      </div>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-white/10 px-3.5 py-2.5 text-xs text-slate-400">
                    <span>{itemMeta(item)}</span>
                    <span>{item.type === "article" ? "Read from source" : "0 comments"}</span>
                  </div>
                </article>
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
            <span>
              Page {pageInfo.page} of {pageInfo.totalPages}
            </span>
            {pageInfo.page < pageInfo.totalPages ? (
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-200 disabled:opacity-50"
              >
                {loadingMore ? "Loading..." : "Load more"}
              </button>
            ) : (
              <span>No more posts</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Home;
