import { useEffect, useState } from "react";
import { Link, useSearchParams, useParams } from "react-router-dom";
import { Angry, ArrowLeft, Brain, Dot, Flame, GraduationCap } from "lucide-react";
import { fetchMatchById } from "../api/matches";
import { fetchSportMatchById } from "../api/sports";

const statColor = (label) => {
  if (label === "Fouls") return "bg-teal-400";
  return "bg-amber-400";
};

const formatEventText = (event) => {
  if (!event || typeof event !== "object") return String(event ?? "");
  const type = Array.isArray(event.incidentTypeName)
    ? event.incidentTypeName.join(", ")
    : event.incidentTypeName || event.type || event.name || "";
  const player = Array.isArray(event.incidentPlayerName)
    ? event.incidentPlayerName.join(", ")
    : event.incidentPlayerName || event.player || "";
  const side =
    event.incidentSide === "1"
      ? "Home"
      : event.incidentSide === "2"
      ? "Away"
      : "";
  const score =
    event.homeScore !== undefined && event.awayScore !== undefined
      ? `${event.homeScore}-${event.awayScore}`
      : "";
  return [side, type, player, score].filter(Boolean).join(" - ");
};

const normalizeLineupGroups = (lineups) => {
  if (!Array.isArray(lineups)) return [];
  const groups = lineups
    .map((group) => ({
      name: group.group || "Lineup",
      home: Array.isArray(group.home) ? group.home : [],
      away: Array.isArray(group.away) ? group.away : [],
    }))
    .filter((group) => group.home.length > 0 || group.away.length > 0);

  const order = ["Starting Lineups", "Substitutes", "Coaches"];
  const ordered = order
    .map((name) => groups.find((group) => group.name === name))
    .filter(Boolean);
  const remaining = groups.filter((group) => !order.includes(group.name));
  return [...ordered, ...remaining];
};

const parseFormation = (formation) => {
  if (!formation || typeof formation !== "string") return null;
  const parts = formation.split("-").map((part) => Number(part));
  if (parts.some((num) => Number.isNaN(num))) return null;
  if (parts.length < 3) return null;
  return parts;
};

const getFormation = (players) => {
  if (!Array.isArray(players)) return null;
  const withFormation = players.find((player) => player?.formation);
  return withFormation?.formation || null;
};

const buildFormationRows = (players, formation) => {
  const sorted = [...players].sort(
    (a, b) => Number(a?.rowIndex || 0) - Number(b?.rowIndex || 0)
  );
  if (!formation) return { rows: [sorted], extras: [] };

  const numbers = parseFormation(formation);
  if (!numbers) return { rows: [sorted], extras: [] };

  const rows = [];
  let cursor = 0;
  numbers.forEach((count) => {
    rows.push(sorted.slice(cursor, cursor + count));
    cursor += count;
  });

  const extras = sorted.slice(cursor);
  return { rows, extras };
};

const IMAGE_BASE = "https://static.flashscore.com/res/image/data/";

const resolvePlayerImage = (player) => {
  const url =
    player?.participantImageVariant84 ||
    player?.participantImageVariant72 ||
    player?.participantImageVariant42 ||
    player?.participantImage ||
    "";
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${IMAGE_BASE}${url}`;
};

const positionColor = (player) => {
  const key = String(player?.positionKey || "");
  if (["1"].includes(key)) return "bg-amber-400";
  if (["2", "3", "4", "5"].includes(key)) return "bg-sky-400";
  if (["6", "7", "8"].includes(key)) return "bg-emerald-400";
  if (["9", "10", "11"].includes(key)) return "bg-rose-400";
  return "bg-white/50";
};

const PlayerChip = ({ player }) => {
  const number = player.participantNumber || "";
  const name =
    player.participantName ||
    player.participantSurname ||
    player.name ||
    "Player";
  const imageUrl = resolvePlayerImage(player);
  const tooltip = formatLineupPlayer(player);
  return (
    <div className="flex flex-col items-center gap-1 text-center" title={tooltip}>
      <div className="relative">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="h-9 w-9 rounded-full border border-white/20 object-cover"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/10 text-[10px] font-semibold text-white">
            {number || " "}
          </div>
        )}
        <span
          className={`absolute -right-1 -bottom-1 h-3 w-3 rounded-full border border-white/20 ${positionColor(
            player
          )}`}
          title={player?.positionKey || ""}
        ></span>
      </div>
      <span className="max-w-[90px] text-[11px] text-white/90">{name}</span>
    </div>
  );
};

const Pitch = ({ title, players, mirrored }) => {
  const formation = getFormation(players);
  const { rows, extras } = buildFormationRows(players, formation);
  const displayRows = mirrored ? [...rows].reverse() : rows;
  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-emerald-900/40 via-emerald-800/30 to-emerald-900/40 p-4">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-widest text-emerald-200/70">
        <span>{title}</span>
        <span>{formation || "Lineup"}</span>
      </div>
      <div className="mt-4 space-y-3">
        {displayRows.map((row, index) => {
          const displayRow = mirrored ? [...row].reverse() : row;
          return (
          <div key={index} className="flex items-center justify-around">
            {displayRow.map((player) => (
              <PlayerChip
                key={player.participantId || player.participantName || index}
                player={player}
              />
            ))}
          </div>
          );
        })}
      </div>
      {extras.length > 0 && (
        <div className="mt-4 rounded-xl bg-black/20 p-3 text-[11px] text-emerald-100/80">
          Extra: {extras.map((player) => player.participantName).join(", ")}
        </div>
      )}
    </div>
  );
};

const formatLineupPlayer = (player) => {
  if (!player || typeof player !== "object") return String(player ?? "");
  const number = player.participantNumber ? `${player.participantNumber}. ` : "";
  const name =
    player.participantName ||
    player.participantSurname ||
    player.name ||
    "Player";
  const incident = Array.isArray(player.incidentTypeName)
    ? player.incidentTypeName.join(", ")
    : player.incidentTypeName || "";
  const tooltip =
    Array.isArray(player.incidentTooltip)
      ? player.incidentTooltip.join(" ")
      : player.incidentTooltip || "";
  const extras = [incident, tooltip].filter(Boolean).join(" - ");
  return `${number}${name}${extras ? ` (${extras})` : ""}`;
};

const parseMinuteValue = (value) => {
  if (!value) return null;
  const match = String(value).match(/(\d+)/);
  if (!match) return null;
  const num = Number(match[1]);
  return Number.isNaN(num) ? null : num;
};

function MatchDetails() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [liveMinute, setLiveMinute] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    const source = searchParams.get("source");
    const loader =
      source === "live" ? fetchSportMatchById(id) : fetchMatchById(id);
    loader
      .then((data) => {
        if (active) setMatch(data);
      })
      .catch(() => {
        if (active) setError("Failed to load match.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (!match) return;
    const baseMinute = parseMinuteValue(match.minute);
    const status = String(match.status || "").toLowerCase();
    const isLive = status.includes("live") || status.includes("in_progress");
    if (baseMinute === null || !isLive) {
      setLiveMinute(match.minute || "");
      return;
    }
    setLiveMinute(`${baseMinute}'`);
    const startedAt = Date.now();
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 60000);
      setLiveMinute(`${baseMinute + elapsed}'`);
    }, 30000);
    return () => clearInterval(interval);
  }, [match]);

  if (loading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-12 text-center text-sm text-slate-400">
        Loading match...
      </div>
    );
  }

  if (!match) {
    const backTo = searchParams.get("source") === "live" ? "/sports" : "/";
    return (
      <div className="space-y-4">
        <p className="text-slate-400">{error || "Match not found."}</p>
        <Link to={backTo} className="text-xs font-semibold uppercase text-white">
          Back to feed
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 text-xs text-slate-400">
        {(() => {
          const backTo = searchParams.get("source") === "live" ? "/sports" : "/";
          return (
        <Link
          to={backTo}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2"
        >
          <ArrowLeft size={14} />
          Back
        </Link>
          );
        })()}
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          AfriPulse
        </span>
      </div>

      <section className="ap-card ap-card-pad border border-white/10 bg-gradient-to-r from-white/10 via-white/5 to-transparent shadow-[0_18px_40px_rgba(0,0,0,0.45)]">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-emerald-300">
              {match.competition}
            </span>
            <span>{match.stage}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-rose-500 px-3 py-1 text-[10px] font-semibold uppercase text-white">
              Live
            </span>
            <Dot className="text-slate-300" size={16} />
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-400">{match.venue}</p>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <div className="flex items-center gap-4">
            {match.home?.badgeUrl ? (
              <img
                src={match.home.badgeUrl}
                alt={match.home.name}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-white/10"></div>
            )}
            <div>
              <p className="text-lg font-semibold text-white">
                {match.home?.name || "Home"}
              </p>
              <p className="text-xs text-slate-400">
                {match.home?.formation || "Formation"}
              </p>
            </div>
          </div>
          <div className="text-center">
            <p className="text-3xl font-semibold text-white">
              {match.home?.score ?? "-"} - {match.away?.score ?? "-"}
            </p>
            <p className="text-xs text-slate-400">
              {liveMinute || match.status || "Live"}
              {match.half ? ` - ${match.half}` : ""}
            </p>
          </div>
          <div className="flex items-center justify-end gap-4">
            <div className="text-right">
              <p className="text-lg font-semibold text-white">
                {match.away?.name || "Away"}
              </p>
              <p className="text-xs text-slate-400">
                {match.away?.formation || "Formation"}
              </p>
            </div>
            {match.away?.badgeUrl ? (
              <img
                src={match.away.badgeUrl}
                alt={match.away.name}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-white/10"></div>
            )}
          </div>
        </div>
      </section>

      {Array.isArray(match.events) && match.events.length > 0 && (
        <section className="ap-card ap-card-pad border border-white/10 bg-gradient-to-r from-white/10 via-white/5 to-transparent shadow-[0_18px_40px_rgba(0,0,0,0.45)]">
          <div className="flex items-center justify-between text-sm text-white">
            <h3 className="font-semibold">Match Events</h3>
            <span className="text-xs text-slate-400">Latest updates</span>
          </div>
          <div className="mt-4 space-y-3 text-sm text-slate-300">
            {match.events.map((event, index) => (
              <div key={index} className="flex items-center gap-3">
                <span className="text-xs text-slate-400">
                  {event.minute ?? ""}'
                </span>
                <span>{event.text || formatEventText(event)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {match.prediction && (
        <section className="ap-card ap-card-pad border border-white/10 bg-gradient-to-r from-white/10 via-white/5 to-transparent shadow-[0_18px_40px_rgba(0,0,0,0.45)]">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Your Prediction</h3>
            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs text-emerald-200">
              +{match.prediction.points} pts potential
            </span>
          </div>
          <div className="mt-4 rounded-2xl bg-white/5 px-4 py-3 text-sm text-white">
            Your prediction: {match.prediction.userPick}
          </div>
          <div className="mt-4 space-y-2 text-xs text-slate-400">
            <div className="flex items-center justify-between">
              <span>Community predictions</span>
              <span>{match.prediction.count} predictions</span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/10">
              <div
                className="h-2 rounded-full bg-emerald-400"
                style={{ width: `${match.prediction.totals?.nigeria || 0}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between text-[10px] uppercase text-slate-500">
              <span>Nigeria {match.prediction.totals?.nigeria || 0}%</span>
              <span>Draw {match.prediction.totals?.draw || 0}%</span>
              <span>Ghana {match.prediction.totals?.ghana || 0}%</span>
            </div>
          </div>
        </section>
      )}

      <section className="ap-card ap-card-pad border border-white/10 bg-gradient-to-r from-white/10 via-white/5 to-transparent shadow-[0_18px_40px_rgba(0,0,0,0.45)]">
        <div className="flex items-center gap-2 text-sm text-white">
          <button
            className={`rounded-full px-4 py-2 text-xs font-semibold ${
              activeTab === "overview" ? "bg-white/10" : "bg-white/5"
            }`}
            onClick={() => setActiveTab("overview")}
            type="button"
          >
            Overview
          </button>
          <button
            className={`rounded-full px-4 py-2 text-xs ${
              activeTab === "lineups" ? "bg-white/10" : "bg-white/5"
            }`}
            onClick={() => setActiveTab("lineups")}
            type="button"
          >
            Lineups
          </button>
          <button
            className={`rounded-full px-4 py-2 text-xs ${
              activeTab === "stats" ? "bg-white/10" : "bg-white/5"
            }`}
            onClick={() => setActiveTab("stats")}
            type="button"
          >
            Stats
          </button>
          <button
            className={`rounded-full px-4 py-2 text-xs ${
              activeTab === "timeline" ? "bg-white/10" : "bg-white/5"
            }`}
            onClick={() => setActiveTab("timeline")}
            type="button"
          >
            Timeline
          </button>
        </div>
        {activeTab === "overview" && (
          <div className="mt-6 grid gap-6 md:grid-cols-[1.2fr_1fr]">
            {Array.isArray(match.stats) && match.stats.length > 0 ? (
              <div className="space-y-4 text-sm text-slate-300">
                {match.stats.map((stat) => (
                  <div key={stat.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{stat.label}</span>
                      <span>
                        {stat.home} - {stat.away}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 rounded-full bg-white/10">
                        <div
                          className={`h-2 rounded-full ${statColor(stat.label)}`}
                          style={{
                            width: `${(stat.home / (stat.home + stat.away)) * 100}%`,
                          }}
                        ></div>
                      </div>
                      <div className="h-2 flex-1 rounded-full bg-white/10">
                        <div
                          className={`h-2 rounded-full ${statColor(stat.label)}`}
                          style={{
                            width: `${(stat.away / (stat.home + stat.away)) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-400">
                Stats not available yet.
              </div>
            )}
            <div className="space-y-6 text-xs text-slate-300">
              {Array.isArray(match.topPredictors) &&
                match.topPredictors.length > 0 && (
                  <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm text-white">
                    <h3 className="font-semibold">Community Predictions</h3>
                    <span className="text-xs text-slate-400">
                      {match.prediction.count} total
                    </span>
                  </div>
                  <div className="space-y-2">
                    {match.topPredictors.map((predictor, index) => (
                    <div
                      key={predictor.name}
                      className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2"
                    >
                      <div className="flex items-center gap-3">
                        <span className="h-6 w-6 rounded-full bg-amber-400 text-center text-[11px] font-semibold text-black">
                          {index + 1}
                        </span>
                        <span>{predictor.name}</span>
                      </div>
                      <span>{predictor.pick}</span>
                      <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-[10px] text-emerald-200">
                        +{predictor.points} pts
                      </span>
                    </div>
                  ))}
                  </div>
                  <button className="rounded-full border border-white/10 px-4 py-2 text-xs text-white/80">
                    View Full Leaderboard
                  </button>
              </div>
              )}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-white">
                  Match Reactions
                </h3>
                <div className="flex flex-wrap gap-3 text-xs text-slate-300">
                  <span className="inline-flex items-center gap-1">
                    <Flame size={14} /> {match.reactions?.fire || 0}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <GraduationCap size={14} /> {match.reactions?.cap || 0}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Brain size={14} /> {match.reactions?.brain || 0}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Angry size={14} /> {match.reactions?.angry || 0}
                  </span>
                </div>
                <button className="rounded-full bg-amber-400 px-4 py-2 text-xs font-semibold text-black">
                  Add Reaction
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "stats" && (
          <div className="mt-6">
            {Array.isArray(match.stats) && match.stats.length > 0 ? (
              <div className="space-y-4 text-sm text-slate-300">
                {match.stats.map((stat) => (
                  <div key={stat.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{stat.label}</span>
                      <span>
                        {stat.home} - {stat.away}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 rounded-full bg-white/10">
                        <div
                          className={`h-2 rounded-full ${statColor(stat.label)}`}
                          style={{
                            width: `${(stat.home / (stat.home + stat.away)) * 100}%`,
                          }}
                        ></div>
                      </div>
                      <div className="h-2 flex-1 rounded-full bg-white/10">
                        <div
                          className={`h-2 rounded-full ${statColor(stat.label)}`}
                          style={{
                            width: `${(stat.away / (stat.home + stat.away)) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-400">
                Stats not available yet.
              </div>
            )}
          </div>
        )}

        {activeTab === "lineups" && (
          <div className="mt-6 text-sm text-slate-300">
            {Array.isArray(match.lineups) &&
            match.lineups.some((group) => group?.home || group?.away) ? (
              <div className="space-y-6">
                {normalizeLineupGroups(match.lineups).map((group) => (
                  <div key={group.name} className="space-y-3">
                    <div className="flex items-center justify-between text-xs uppercase tracking-widest text-slate-400">
                      <span>{group.name}</span>
                    </div>
                    {group.name === "Starting Lineups" ? (
                      <div className="grid gap-4 md:grid-cols-2">
                        <Pitch title="Home" players={group.home} />
                        <Pitch title="Away" players={group.away} mirrored />
                      </div>
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Home
                          </p>
                          {group.home.length > 0 ? (
                            <div className="mt-3 space-y-2 text-sm text-slate-200">
                              {group.home.map((player) => (
                                <div
                                  key={player.participantId || player.participantName}
                                  className="rounded-lg bg-white/5 px-3 py-2"
                                >
                                  {formatLineupPlayer(player)}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="mt-3 text-xs text-slate-400">No data.</p>
                          )}
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Away
                          </p>
                          {group.away.length > 0 ? (
                            <div className="mt-3 space-y-2 text-sm text-slate-200">
                              {group.away.map((player) => (
                                <div
                                  key={player.participantId || player.participantName}
                                  className="rounded-lg bg-white/5 px-3 py-2"
                                >
                                  {formatLineupPlayer(player)}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="mt-3 text-xs text-slate-400">No data.</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-400">
                Lineups not available yet.
              </div>
            )}
          </div>
        )}

        {activeTab === "timeline" && (
          <div className="mt-6">
            {Array.isArray(match.events) && match.events.length > 0 ? (
              <div className="space-y-3 text-sm text-slate-300">
                {match.events.map((event, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">
                      {event.minute ?? ""}'
                    </span>
                    <span>{event.text || formatEventText(event)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-400">
                Timeline not available yet.
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

export default MatchDetails;
