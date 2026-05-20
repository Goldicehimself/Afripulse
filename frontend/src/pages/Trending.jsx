import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchTrending } from "../api/posts";

const orderedCategories = ["sports", "news", "entertainment", "music"];

const toTitle = (value = "") =>
  value
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");

const getScore = (reactions = {}) =>
  ["fire", "cap", "brain", "angry"].reduce(
    (sum, key) => sum + (reactions?.[key] || 0),
    0
  );

const feedLabels = {
  "nigeria-news": "Nigeria News",
  "nigeria-politics": "Nigeria Politics",
  entertainment: "Entertainment",
  "africa-gist": "Africa Gist",
  "global-sports": "Global Sports",
};

function Trending() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    fetchTrending(12)
      .then((data) => {
        if (!active) return;
        setItems(Array.isArray(data?.items) ? data.items : []);
      })
      .catch(() => {
        if (!active) return;
        setError("Failed to load trending posts.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const sections = useMemo(() => {
    const grouped = new Map();
    items.forEach((post) => {
      const key = (post.category || "other").toLowerCase();
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push({
        ...post,
        score: getScore(post.reactions),
      });
    });

    const ordered = [];
    orderedCategories.forEach((key) => {
      if (grouped.has(key)) {
        ordered.push({ key, title: toTitle(key), items: grouped.get(key) });
        grouped.delete(key);
      }
    });

    Array.from(grouped.entries()).forEach(([key, list]) => {
      ordered.push({ key, title: toTitle(key), items: list });
    });

    return ordered;
  }, [items]);

  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <h1 className="ap-title text-white">Trending</h1>
        <p className="ap-subtitle">
          The hottest topics across news, sports, entertainment, and music.
        </p>
      </header>

      {error && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-10 text-center text-sm text-slate-400">
          Loading trending posts...
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-10 text-center text-sm text-slate-400">
          No trending posts yet.
        </div>
      ) : (
        <div className="space-y-5">
          {sections.map((section) => (
            <section key={section.key} className="space-y-2.5">
              <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                {section.title}
              </h2>
              {section.items.map((topic) => {
                const isArticle = topic.type === "article";
                const Wrapper = isArticle ? "a" : Link;
                const wrapperProps = isArticle
                  ? {
                      href: topic.sourceUrl,
                      target: "_blank",
                      rel: "noreferrer",
                    }
                  : { to: `/posts/${topic._id}` };

                return (
                <Wrapper
                  key={`${topic.type || "post"}-${topic._id || topic.title}`}
                  {...wrapperProps}
                  className="ap-card flex items-center justify-between gap-4 border border-white/10 bg-white/5 px-4 py-3 shadow-[0_10px_24px_rgba(0,0,0,0.32)] transition hover:-translate-y-0.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">
                      {topic.title}
                    </p>
                    <p className="text-xs text-slate-400">
                      {isArticle
                        ? `${topic.sourceName || feedLabels[topic.feedKey] || "External source"}`
                        : `${topic.score} reactions`}
                    </p>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-wide text-slate-300">
                    {isArticle
                      ? feedLabels[topic.feedKey] || toTitle(topic.category || "Other")
                      : toTitle(topic.category || "Other")}
                  </span>
                </Wrapper>
                );
              })}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

export default Trending;
