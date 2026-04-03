import { useEffect, useState } from "react";
import { Angry, Brain, Flame } from "lucide-react";
import { fetchShorts } from "../api/shorts";

function Shorts() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    fetchShorts(20)
      .then((data) => {
        if (!active) return;
        setItems(data.items || []);
      })
      .catch(() => {
        if (!active) return;
        setError("Failed to load shorts.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="ap-title text-white">Shorts</h1>
        <p className="ap-subtitle">
          Swipeable stories in under 30 seconds.
        </p>
      </header>

      {error && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-12 text-center text-sm text-slate-400">
          Loading shorts...
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-12 text-center text-sm text-slate-400">
          No shorts yet.
        </div>
      ) : (
        <div className="ap-card ap-card-pad h-[70vh] snap-y snap-mandatory overflow-y-auto border border-white/10 bg-white/5">
          {items.map((short) => (
            <div
              key={short._id || short.title}
              className="relative mb-4 h-[60vh] snap-start overflow-hidden rounded-3xl"
            >
              {short.image ? (
                <img
                  src={short.image}
                  alt={short.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-slate-700 to-slate-900" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
              <div className="absolute bottom-6 left-6 space-y-3 text-white">
                <h2 className="text-2xl font-semibold">{short.title}</h2>
                <div className="flex items-center gap-3 text-sm text-slate-200">
                  <span className="inline-flex items-center gap-1">
                    <Flame size={14} /> {short.reactions?.fire || 0}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Brain size={14} /> {short.reactions?.brain || 0}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Angry size={14} /> {short.reactions?.angry || 0}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Shorts;
