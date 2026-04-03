import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchLiveSports } from "../api/sports";
import PostFeed from "../components/PostFeed";

const leagues = [
  { key: "epl", label: "EPL" },
  { key: "npfl", label: "NPFL" },
  { key: "laliga", label: "LaLiga" },
  { key: "bundesliga", label: "Bundesliga" },
  { key: "ligue1", label: "Ligue 1" },
  { key: "seriea", label: "Serie A" },
  { key: "portugal", label: "Portugal" },
  { key: "turkey", label: "Turkey" },
  { key: "netherlands", label: "Netherlands" },
  { key: "belgium", label: "Belgium" },
];

function Sports() {
  const [liveItems, setLiveItems] = useState([]);
  const [finishedItems, setFinishedItems] = useState([]);
  const [upcomingItems, setUpcomingItems] = useState([]);
  const [selectedLeagues, setSelectedLeagues] = useState(
    leagues.map((league) => league.key)
  );
  const [loadingLive, setLoadingLive] = useState(true);
  const [loadingUpcoming, setLoadingUpcoming] = useState(true);
  const [error, setError] = useState("");
  const [visibleUpcoming, setVisibleUpcoming] = useState({});
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem("sportsFixturesTab") || "live";
  });

  useEffect(() => {
    let active = true;
    setLoadingLive(true);
    fetchLiveSports(selectedLeagues)
      .then((data) => {
        if (!active) return;
        setLiveItems(data.live?.items || []);
        setFinishedItems(data.finished?.items || []);
      })
      .catch(() => {
        if (!active) return;
        setError("Unable to load live fixtures.");
      })
      .finally(() => {
        if (active) setLoadingLive(false);
      });
    return () => {
      active = false;
    };
  }, [selectedLeagues]);

  useEffect(() => {
    let active = true;
    setLoadingUpcoming(true);
    // Load upcoming fixtures once (all leagues), independent of live filters.
    fetchLiveSports()
      .then((data) => {
        if (!active) return;
        const upcoming = (data.leagues || [])
          .flatMap((league) =>
            (league.upcoming || []).map((event) => ({
              ...event,
              league: league.name || league.key || "League",
            }))
          )
          .filter((event) => event.homeTeam || event.awayTeam);
        setUpcomingItems(upcoming);
      })
      .catch(() => {
        if (!active) return;
        setError("Unable to load upcoming fixtures.");
      })
      .finally(() => {
        if (active) setLoadingUpcoming(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setVisibleUpcoming({});
  }, [upcomingItems]);

  const toggleLeague = (key) => {
    setSelectedLeagues((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    );
  };

  const groupedUpcoming = useMemo(() => {
    const map = new Map();
    upcomingItems.forEach((event) => {
      const league = event.league || "League";
      if (!map.has(league)) map.set(league, []);
      map.get(league).push(event);
    });
    return Array.from(map.entries());
  }, [upcomingItems]);
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">
            Fixtures
          </h2>
          <span className="text-xs text-slate-500">Powered by SportDB.dev</span>
        </div>
        {error && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        )}
        {liveItems.length === 0 && finishedItems.length === 0 && (
          <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
            Live data temporarily unavailable (provider quota exceeded). We will
            show cached results once available.
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {leagues.map((league) => (
            <button
              key={league.key}
              type="button"
              onClick={() => toggleLeague(league.key)}
              className={`league-pill rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide transition ${
                selectedLeagues.includes(league.key)
                  ? "league-pill--active bg-white/15 text-white"
                  : "border border-white/10 bg-white/5 text-slate-400"
              }`}
            >
              {league.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { key: "live", label: "Live" },
            { key: "finished", label: "Finished" },
            { key: "upcoming", label: "Upcoming" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setActiveTab(tab.key);
                localStorage.setItem("sportsFixturesTab", tab.key);
              }}
              className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                activeTab === tab.key
                  ? "bg-white/15 text-white"
                  : "border border-white/10 bg-white/5 text-slate-400"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "live" && loadingLive ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-10 text-center text-sm text-slate-400">
            Loading live fixtures...
          </div>
        ) : activeTab === "live" && liveItems.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-10 text-center text-sm text-slate-400">
            No live matches right now.
          </div>
        ) : activeTab === "live" ? (
          <div className="grid gap-4 md:grid-cols-2">
            {liveItems.map((match) => {
              const matchId = match.id || match.raw?.eventId;
              const card = (
                <>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-emerald-200">
                      {match.competition || "Live"}
                    </span>
                    <span>{match.minute || match.status || "Live"}</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-white">
                    <div>
                      <p className="text-sm font-semibold">
                        {match.homeName || "Home"}
                      </p>
                      <p className="text-xs text-slate-400">vs</p>
                      <p className="text-sm font-semibold">
                        {match.awayName || "Away"}
                      </p>
                    </div>
                    <div className="text-2xl font-semibold">
                      {match.homeScore ?? "-"} - {match.awayScore ?? "-"}
                    </div>
                  </div>
                </>
              );

              return matchId ? (
                <Link
                  key={matchId}
                  to={`/matches/${matchId}?source=live`}
                  className="ap-card ap-card-pad border border-white/10 bg-gradient-to-r from-white/10 via-white/5 to-transparent shadow-[0_16px_40px_rgba(0,0,0,0.45)] transition hover:-translate-y-1"
                >
                  {card}
                </Link>
              ) : (
                <div
                  key={`${match.homeName}-${match.awayName}`}
                  className="ap-card ap-card-pad border border-white/10 bg-gradient-to-r from-white/10 via-white/5 to-transparent opacity-60"
                >
                  {card}
                  <p className="mt-2 text-xs text-slate-400">
                    Match details unavailable.
                  </p>
                </div>
              );
            })}
          </div>
        ) : null}

        {activeTab === "finished" && loadingLive ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-10 text-center text-sm text-slate-400">
            Loading finished fixtures...
          </div>
        ) : activeTab === "finished" && finishedItems.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-10 text-center text-sm text-slate-400">
            No finished matches yet.
          </div>
        ) : activeTab === "finished" ? (
          <div className="grid gap-4 md:grid-cols-2">
            {finishedItems.map((match) => {
              const matchId = match.id || match.raw?.eventId;
              const card = (
                <>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="rounded-full bg-white/10 px-3 py-1 text-slate-200">
                      {match.competition || "Finished"}
                    </span>
                    <span>{match.status || "FT"}</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-white">
                    <div>
                      <p className="text-sm font-semibold">
                        {match.homeName || "Home"}
                      </p>
                      <p className="text-xs text-slate-400">vs</p>
                      <p className="text-sm font-semibold">
                        {match.awayName || "Away"}
                      </p>
                    </div>
                    <div className="text-2xl font-semibold">
                      {match.homeScore ?? "-"} - {match.awayScore ?? "-"}
                    </div>
                  </div>
                </>
              );

              return matchId ? (
                <Link
                  key={matchId}
                  to={`/matches/${matchId}?source=live`}
                  className="ap-card ap-card-pad border border-white/10 bg-gradient-to-r from-white/10 via-white/5 to-transparent shadow-[0_16px_40px_rgba(0,0,0,0.45)] transition hover:-translate-y-1"
                >
                  {card}
                </Link>
              ) : (
                <div
                  key={`${match.homeName}-${match.awayName}-finished`}
                  className="ap-card ap-card-pad border border-white/10 bg-gradient-to-r from-white/10 via-white/5 to-transparent opacity-60"
                >
                  {card}
                  <p className="mt-2 text-xs text-slate-400">
                    Match details unavailable.
                  </p>
                </div>
              );
            })}
          </div>
        ) : null}

        {activeTab === "upcoming" && loadingUpcoming ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-10 text-center text-sm text-slate-400">
            Loading upcoming fixtures...
          </div>
        ) : activeTab === "upcoming" && upcomingItems.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-10 text-center text-sm text-slate-400">
            No upcoming fixtures found.
          </div>
        ) : activeTab === "upcoming" ? (
          <div className="space-y-6">
            {groupedUpcoming.map(([league, events]) => {
              const visibleCount = visibleUpcoming[league] || 6;
              const visibleEvents = events.slice(0, visibleCount);
              const canShowMore = events.length > visibleCount;
              return (
              <div key={league} className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                  {league}
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {visibleEvents.map((event) => {
                    const matchLabel = `${event.homeTeam || "Home"} vs ${event.awayTeam || "Away"}`;
                    const extraName =
                      event.name &&
                      event.name.trim().toLowerCase() !==
                        matchLabel.trim().toLowerCase()
                        ? event.name
                        : "";
                    return (
                      <div
                        key={event.id || `${event.homeTeam}-${event.awayTeam}-${event.date}`}
                        className="ap-card ap-card-pad border border-white/10 bg-gradient-to-r from-white/10 via-white/5 to-transparent shadow-[0_16px_40px_rgba(0,0,0,0.45)]"
                      >
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span className="rounded-full bg-white/10 px-3 py-1 text-slate-200">
                            {league}
                          </span>
                          <span>
                            {event.date || "TBD"}
                            {event.time ? ` • ${event.time}` : ""}
                          </span>
                        </div>
                        <div className="mt-4 text-white">
                          <p className="text-sm font-semibold">{matchLabel}</p>
                          {extraName && (
                            <p className="mt-1 text-xs text-slate-400">
                              {extraName}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {canShowMore && (
                  <button
                    type="button"
                    onClick={() =>
                      setVisibleUpcoming((prev) => ({
                        ...prev,
                        [league]: visibleCount + 6,
                      }))
                    }
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-300 transition hover:-translate-y-0.5"
                  >
                    Load more
                  </button>
                )}
              </div>
              );
            })}
          </div>
        ) : null}
      </section>

      <PostFeed
        fixedCategory="sports"
        title="Sports"
        subtitle="Match reports and highlights."
      />
    </div>
  );
}

export default Sports;
