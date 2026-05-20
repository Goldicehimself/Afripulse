import { useEffect, useState } from "react";
import { ExternalLink, RefreshCw } from "lucide-react";
import { fetchFeed, refreshFeed } from "../api/feeds";
import SafeImage from "./SafeImage";
import useAuthStore from "../store/useAuthStore";

const formatDate = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

function ExternalFeed({ feedKey, title, subtitle, limit = 8 }) {
  const user = useAuthStore((state) => state.user);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadFeed = () => {
    setLoading(true);
    setError("");
    fetchFeed(feedKey, limit)
      .then((data) => setItems(data.items || []))
      .catch(() => setError("Failed to load this feed."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadFeed();
  }, [feedKey, limit]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setError("");
    try {
      const data = await refreshFeed(feedKey);
      setItems(data.items || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to refresh feed.");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
        </div>
        {user?.role === "admin" && (
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700 disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing" : "Refresh"}
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-8 text-center text-sm text-slate-500">
          Loading stories...
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-8 text-center text-sm text-slate-500">
          No stories cached yet.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((item) => (
            <article
              key={item._id}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
            >
              <SafeImage
                src={item.coverImageUrl}
                alt={item.title}
                className="h-32 w-full object-cover"
              />
              <div className="space-y-2.5 p-4">
                <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
                  <span>{item.sourceName || "News source"}</span>
                  <span>{formatDate(item.publishedAt || item.createdAt)}</span>
                </div>
                <h3 className="text-base font-semibold leading-snug text-slate-950">
                  {item.title}
                </h3>
                {item.summary && (
                  <p className="line-clamp-2 text-sm leading-5 text-slate-600">
                    {item.summary}
                  </p>
                )}
                {item.sourceUrl && (
                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-900 hover:underline"
                  >
                    Read from source
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default ExternalFeed;
