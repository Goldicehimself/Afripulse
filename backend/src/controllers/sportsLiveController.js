const fs = require("fs");
const path = require("path");

const API_FOOTBALL_BASE = "https://v3.football.api-sports.io";
const LIVE_TTL_MS = 5 * 60 * 1000;
const UPCOMING_TTL_MS = 12 * 60 * 60 * 1000;
const MATCH_DETAILS_TTL_MS = 60 * 1000;
const QUOTA_COOLDOWN_MS = 5 * 60 * 1000;
const DAILY_REQUEST_LIMIT = 90;
const PER_MINUTE_LIMIT = 8;

const LEAGUES = [
  { key: "epl", name: "Premier League", country: "England", apiFootball: { id: 39 } },
  { key: "laliga", name: "La Liga", country: "Spain", apiFootball: { id: 140 } },
  { key: "bundesliga", name: "Bundesliga", country: "Germany", apiFootball: { id: 78 } },
  { key: "ligue1", name: "Ligue 1", country: "France", apiFootball: { id: 61 } },
  { key: "seriea", name: "Serie A", country: "Italy", apiFootball: { id: 135 } },
  { key: "netherlands", name: "Eredivisie", country: "Netherlands", apiFootball: { id: 88 } },
  { key: "portugal", name: "Primeira Liga", country: "Portugal", apiFootball: { id: 94 } },
  { key: "ucl", name: "UEFA Champions League", country: "Europe", apiFootball: { id: null, search: "Champions League" } },
  { key: "npfl", name: "NPFL", country: "Nigeria", apiFootball: { id: null, search: "NPFL" } },
];

const liveCache = new Map();
const upcomingCache = new Map();
const fixturesRangeCache = new Map();
const matchDetailsCache = new Map();
let lastQuotaErrorAt = null;
let requestBudget = { date: "", count: 0 };
let recentCalls = [];
const resolvedLeagueIds = new Map();
let quotaBlockedDate = "";

const CACHE_FILE = path.join(__dirname, "..", "utils", "api_football_cache.json");

const loadCacheFromDisk = () => {
  try {
    if (!fs.existsSync(CACHE_FILE)) return;
    const raw = fs.readFileSync(CACHE_FILE, "utf8");
    const data = JSON.parse(raw);
    if (data?.live) liveCache.set("live:all", data.live);
    if (data?.upcoming) upcomingCache.set("upcoming:all", data.upcoming);
  } catch (_) {}
};

const saveCacheToDisk = () => {
  try {
    const live = liveCache.get("live:all") || null;
    const upcoming = upcomingCache.get("upcoming:all") || null;
    fs.writeFileSync(CACHE_FILE, JSON.stringify({ live, upcoming }, null, 2), "utf8");
  } catch (_) {}
};

loadCacheFromDisk();

const ensureBudget = () => {
  const today = new Date().toISOString().slice(0, 10);
  if (requestBudget.date !== today) {
    requestBudget = { date: today, count: 0 };
    quotaBlockedDate = "";
  }
  if (quotaBlockedDate === today) {
    throw new Error("Quota throttle: daily request limit reached.");
  }
  if (requestBudget.count >= DAILY_REQUEST_LIMIT) {
    throw new Error("Quota throttle: daily request limit reached.");
  }
  const now = Date.now();
  recentCalls = recentCalls.filter((t) => now - t < 60 * 1000);
  if (recentCalls.length >= PER_MINUTE_LIMIT) {
    throw new Error("Quota throttle: per-minute limit reached.");
  }
  recentCalls.push(now);
  requestBudget.count += 1;
};

const fetchJson = async (pathName, apiKey, params = {}) => {
  ensureBudget();
  const url = new URL(`${API_FOOTBALL_BASE}${pathName}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });
  const res = await fetch(url.toString(), {
    headers: {
      "x-apisports-key": apiKey,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    if (/request limit for the day|daily|limit reached/i.test(text)) {
      quotaBlockedDate = new Date().toISOString().slice(0, 10);
    }
    throw new Error(`Request failed (${res.status}): ${text}`);
  }
  const json = await res.json();
  if (json?.errors && Object.keys(json.errors).length > 0) {
    const message =
      json.errors.rateLimit ||
      json.errors.requests ||
      json.errors.token ||
      json.errors.plan ||
      json.errors.api ||
      JSON.stringify(json.errors);
    if (/request limit for the day|daily|limit/i.test(String(message))) {
      quotaBlockedDate = new Date().toISOString().slice(0, 10);
    }
    throw new Error(String(message));
  }
  return json;
};

const normalizeText = (value) => String(value || "").toLowerCase().trim();

const formatLiveStatus = (status) => {
  const value = normalizeText(status?.short || status?.long || status);
  if (!value) return "";
  if (value === "ht") return "HT";
  if (["ft", "aet", "pen"].includes(value)) return "FT";
  if (value === "ns") return "NS";
  if (value.includes("post") || value.includes("pst")) return "POSTP";
  if (value.includes("canc")) return "CANC";
  if (value.includes("live") || value.includes("1h") || value.includes("2h"))
    return "LIVE";
  return String(status?.short || status || "");
};

const isLiveStage = (status) => {
  const value = normalizeText(status?.short || status?.long || status);
  if (!value) return false;
  return ["1h", "2h", "ht", "et", "bt", "p"].includes(value) || value.includes("live");
};

const isFinishedStage = (status) => {
  const value = normalizeText(status?.short || status?.long || status);
  return ["ft", "aet", "pen"].includes(value) || value.includes("finished");
};

const normalizeLiveItem = (item) => {
  const fixture = item?.fixture || {};
  const teams = item?.teams || {};
  const goals = item?.goals || {};
  const league = item?.league || {};
  const status = fixture?.status || {};
  const minute = status?.elapsed ? `${status.elapsed}'` : "";

  return {
    id: fixture?.id || null,
    homeName: teams?.home?.name || "",
    awayName: teams?.away?.name || "",
    homeScore: goals?.home ?? null,
    awayScore: goals?.away ?? null,
    status: formatLiveStatus(status),
    minute,
    competition: league?.name || "",
    country: league?.country || "",
    leagueId: league?.id || null,
    isLive: isLiveStage(status),
    isFinished: isFinishedStage(status),
    raw: item,
    fixtureDate: fixture?.date || "",
  };
};

const normalizeUpcomingFixture = (item) => {
  const fixture = item?.fixture || {};
  const teams = item?.teams || {};
  const dateTime = fixture?.date ? new Date(fixture.date) : null;
  const date = dateTime ? dateTime.toISOString().slice(0, 10) : null;
  const time = dateTime ? dateTime.toISOString().slice(11, 16) : null;
  return {
    id: fixture?.id || null,
    name: fixture?.referee || "",
    homeTeam: teams?.home?.name || "",
    awayTeam: teams?.away?.name || "",
    date,
    time,
    homeScore: null,
    awayScore: null,
    thumb: teams?.home?.logo || "",
    status: fixture?.status?.short || "NS",
  };
};

const LAGOS_TZ = "Africa/Lagos";

const formatDateInTz = (date, timeZone = LAGOS_TZ) => {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
};

const formatDate = (date) => formatDateInTz(date, LAGOS_TZ);

const dateKeyInTz = (value, timeZone = LAGOS_TZ) => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return formatDateInTz(date, timeZone);
};

const getLiveMatches = async (apiKey) => {
  return fetchJson("/fixtures", apiKey, { live: "all" });
};

const getFixturesForDates = async (apiKey, dates) => {
  const unique = Array.from(new Set(dates.filter(Boolean)));
  const results = [];
  for (const date of unique) {
    const res = await fetchJson("/fixtures", apiKey, { date });
    if (Array.isArray(res?.response)) {
      results.push(...res.response);
    }
  }
  return results;
};

const getFixtureById = async (apiKey, fixtureId) => {
  return fetchJson("/fixtures", apiKey, { id: fixtureId });
};

const getFixtureEvents = async (apiKey, fixtureId) => {
  return fetchJson("/fixtures/events", apiKey, { fixture: fixtureId });
};

const getFixtureStatistics = async (apiKey, fixtureId) => {
  return fetchJson("/fixtures/statistics", apiKey, { fixture: fixtureId });
};

const getFixtureLineups = async (apiKey, fixtureId) => {
  return fetchJson("/fixtures/lineups", apiKey, { fixture: fixtureId });
};

const getFixturePlayers = async (apiKey, fixtureId) => {
  return fetchJson("/fixtures/players", apiKey, { fixture: fixtureId });
};

const isQuotaError = (error) => {
  const message = String(error?.message || error || "").toLowerCase();
  return message.includes("quota") || message.includes("limit");
};

const findCachedFixtureById = (fixtureId) => {
  const id = String(fixtureId);

  for (const entry of liveCache.values()) {
    const items = Array.isArray(entry?.data?.response) ? entry.data.response : [];
    const match = items.find((item) => String(item?.fixture?.id) === id);
    if (match) return match;
  }

  for (const entry of fixturesRangeCache.values()) {
    const items = Array.isArray(entry?.data) ? entry.data : [];
    const match = items.find((item) => String(item?.fixture?.id) === id);
    if (match) return match;
  }

  return null;
};

const normalizeEvent = (event) => {
  const elapsed = event?.time?.elapsed;
  const extra = event?.time?.extra;
  const minute = elapsed ? `${elapsed}${extra ? `+${extra}` : ""}` : "";
  const teamName = event?.team?.name || "";
  const playerName = event?.player?.name || "";
  const assistName = event?.assist?.name || "";
  const detail = event?.detail || event?.type || "";
  const text = [teamName, playerName, detail, assistName ? `Assist: ${assistName}` : ""]
    .filter(Boolean)
    .join(" - ");

  return {
    minute,
    text,
    team: teamName,
    player: playerName,
    assist: assistName,
    type: event?.type || "",
    detail,
  };
};

const normalizeStatistics = (items) => {
  if (!Array.isArray(items) || items.length < 2) return [];
  const home = items[0];
  const away = items[1];
  const homeStats = Array.isArray(home?.statistics) ? home.statistics : [];
  const awayStats = Array.isArray(away?.statistics) ? away.statistics : [];

  return homeStats.map((stat, index) => {
    const awayStat = awayStats[index] || {};
    return {
      label: stat?.type || awayStat?.type || `Stat ${index + 1}`,
      home: stat?.value ?? 0,
      away: awayStat?.value ?? 0,
    };
  });
};

const mergeLineupPlayers = (basePlayers = [], playerStats = []) => {
  return basePlayers.map((player) => {
    const playerId = player?.player?.id || player?.id;
    const statsMatch = playerStats.find(
      (entry) => (entry?.player?.id || entry?.id) === playerId
    );
    return {
      participantId: playerId || null,
      participantName: player?.player?.name || player?.name || "",
      participantNumber: player?.player?.number || player?.number || "",
      positionKey: player?.player?.pos || player?.pos || "",
      formation: player?.player?.grid || player?.grid || "",
      incidentTypeName: statsMatch?.statistics?.[0]?.games?.rating
        ? [`Rating ${statsMatch.statistics[0].games.rating}`]
        : "",
      incidentTooltip: "",
    };
  });
};

const normalizeLineups = (lineups, players) => {
  if (!Array.isArray(lineups) || lineups.length === 0) return null;
  const byTeam = new Map(
    (Array.isArray(players) ? players : []).map((entry) => [entry?.team?.id, entry])
  );
  const home = lineups[0];
  const away = lineups[1];
  const homePlayers = byTeam.get(home?.team?.id)?.players || [];
  const awayPlayers = byTeam.get(away?.team?.id)?.players || [];

  return [
    {
      group: "Starting Lineups",
      home: mergeLineupPlayers(home?.startXI || [], homePlayers),
      away: mergeLineupPlayers(away?.startXI || [], awayPlayers),
    },
    {
      group: "Substitutes",
      home: mergeLineupPlayers(home?.substitutes || [], homePlayers),
      away: mergeLineupPlayers(away?.substitutes || [], awayPlayers),
    },
    {
      group: "Coaches",
      home: home?.coach?.name
        ? [{ participantId: `coach-${home.team.id}`, participantName: home.coach.name }]
        : [],
      away: away?.coach?.name
        ? [{ participantId: `coach-${away.team.id}`, participantName: away.coach.name }]
        : [],
    },
  ];
};

const normalizeEmbeddedLineups = (item) => {
  const embedded = Array.isArray(item?.lineups) ? item.lineups : [];
  const embeddedPlayers = Array.isArray(item?.players) ? item.players : [];
  return normalizeLineups(embedded, embeddedPlayers);
};

const normalizeMatch = (item, extras = {}) => {
  const fixture = item?.fixture || {};
  const league = item?.league || {};
  const teams = item?.teams || {};
  const goals = item?.goals || {};
  const score = item?.score || {};
  const status = fixture?.status || {};

  return {
    id: fixture?.id || null,
    competition: league?.name || "",
    stage: league?.round || "",
    venue: fixture?.venue?.name || "",
    status: status?.short || "",
    statusLong: status?.long || "",
    minute: status?.elapsed ? `${status.elapsed}'` : "",
    half: status?.long || "",
    isLive: isLiveStage(status),
    home: {
      name: teams?.home?.name || "",
      formation: extras.homeFormation || "",
      score: goals?.home ?? null,
      badgeUrl: teams?.home?.logo || "",
    },
    away: {
      name: teams?.away?.name || "",
      formation: extras.awayFormation || "",
      score: goals?.away ?? null,
      badgeUrl: teams?.away?.logo || "",
    },
    events: extras.events || [],
    stats: extras.stats || [],
    lineups: extras.lineups || null,
    prediction: null,
    topPredictors: [],
    reactions: { fire: 0, cap: 0, brain: 0, angry: 0 },
    raw: item,
    score,
  };
};

const resolveLeagueId = async (apiKey, league) => {
  if (league.apiFootball?.id) return league.apiFootball.id;
  if (resolvedLeagueIds.has(league.key)) return resolvedLeagueIds.get(league.key);

  const envKey =
    league.key === "npfl" && process.env.NPFL_LEAGUE_ID
      ? Number(process.env.NPFL_LEAGUE_ID)
      : league.key === "ucl" && process.env.UCL_LEAGUE_ID
      ? Number(process.env.UCL_LEAGUE_ID)
      : null;
  if (envKey) {
    resolvedLeagueIds.set(league.key, envKey);
    return envKey;
  }

  try {
    const search = league.apiFootball?.search || league.name;
    const result = await fetchJson("/leagues", apiKey, { search, country: league.country });
    const items = Array.isArray(result?.response) ? result.response : [];
    const match = items.find((item) =>
      normalizeText(item?.league?.name) === normalizeText(league.name) &&
      normalizeText(item?.country?.name) === normalizeText(league.country)
    );
    const id = match?.league?.id || null;
    if (id) {
      resolvedLeagueIds.set(league.key, id);
    }
    return id;
  } catch (_) {
    return null;
  }
};

const getLeagueMatchers = (leagues) => {
  return leagues.map((league) => {
    const name = normalizeText(league.name);
    const country = normalizeText(league.country);
    return {
      key: league.key,
      id: league.apiFootball?.id || null,
      match: (item) => {
        const leagueName = normalizeText(item?.competition || item?.league?.name);
        const leagueCountry = normalizeText(item?.country || item?.league?.country);
        return (
          (name && leagueName === name) &&
          (!country || leagueCountry === country)
        );
      },
    };
  });
};

const getLiveSports = async (req, res) => {
  try {
    const apiKey = process.env.API_FOOTBALL_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: "API_FOOTBALL_KEY not set." });
    }

    const requested = (req.query.leagues || "")
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);

    const leagues =
      requested.length > 0
        ? LEAGUES.filter((league) => requested.includes(league.key))
        : LEAGUES;

    const liveCacheKey = `live:${requested.sort().join(",") || "all"}`;
    const cachedLive = liveCache.get(liveCacheKey);
    let liveResult = null;
    const todayIso = new Date().toISOString().slice(0, 10);
    const quotaBlockedToday = quotaBlockedDate === todayIso;
    if (cachedLive && Date.now() - cachedLive.ts < LIVE_TTL_MS) {
      liveResult = cachedLive.data;
    } else if (quotaBlockedToday) {
      liveResult = cachedLive?.data || { error: "Daily quota reached. Serving cached data only." };
    } else {
      const force = String(req.query.force || "") === "1";
      const inCooldown =
        !force &&
        lastQuotaErrorAt &&
        Date.now() - lastQuotaErrorAt < QUOTA_COOLDOWN_MS;
      if (inCooldown) {
        liveResult = { error: "Quota cooldown active. Serving cached data." };
      } else {
        liveResult = await (async () => {
          try {
            return await getLiveMatches(apiKey);
          } catch (err) {
            return { error: err.message };
          }
        })();
      }
      liveCache.set(liveCacheKey, { ts: Date.now(), data: liveResult });
      if (liveCacheKey === "live:all") saveCacheToDisk();
    }

    const skipUpcoming =
      !!liveResult?.error &&
      (String(liveResult.error).toLowerCase().includes("limit") ||
        String(liveResult.error).toLowerCase().includes("quota"));
    if (skipUpcoming) {
      lastQuotaErrorAt = Date.now();
    } else if (liveResult && !liveResult.error) {
      lastQuotaErrorAt = null;
    }

    const now = new Date();
    const today = formatDateInTz(now, LAGOS_TZ);
    const tomorrow = formatDateInTz(
      new Date(now.getTime() + 24 * 60 * 60 * 1000),
      LAGOS_TZ
    );

    const forceRefresh = String(req.query.force || "") === "1";
    const fixturesRangeCacheKey = `fixtures:${today}:${tomorrow}`;
    let fixturesRange = null;
    const cachedFixturesRange = fixturesRangeCache.get(fixturesRangeCacheKey);
    if (!forceRefresh && cachedFixturesRange && Date.now() - cachedFixturesRange.ts < UPCOMING_TTL_MS) {
      fixturesRange = cachedFixturesRange.data;
    } else if (!skipUpcoming) {
      try {
        fixturesRange = await getFixturesForDates(apiKey, [today, tomorrow]);
      } catch (err) {
        fixturesRange = [];
      }
      fixturesRangeCache.set(fixturesRangeCacheKey, {
        ts: Date.now(),
        data: fixturesRange,
      });
    }

    let upcoming = [];
    const upcomingCacheKey = `upcoming:${leagues.map((l) => l.key).sort().join(",")}`;
    const cachedUpcoming = upcomingCache.get(upcomingCacheKey);
    if (!forceRefresh && cachedUpcoming && Date.now() - cachedUpcoming.ts < UPCOMING_TTL_MS) {
      upcoming = cachedUpcoming.data;
    } else if (!skipUpcoming) {
      const resolved = await Promise.all(
        leagues.map(async (league) => {
          if (league.apiFootball?.id) return league;
          const id = await resolveLeagueId(apiKey, league);
          return {
            ...league,
            apiFootball: { ...(league.apiFootball || {}), id: id || null },
          };
        })
      );

      const fixturesForUpcoming = Array.isArray(fixturesRange) ? fixturesRange : [];
      upcoming = resolved.map((league) => {
        const items = fixturesForUpcoming
          .filter((fixture) => fixture?.league?.id === league.apiFootball?.id)
          .filter((fixture) => normalizeText(fixture?.fixture?.status?.short) === "ns")
          .map(normalizeUpcomingFixture);
        return { ...league, upcoming: items };
      });
      upcomingCache.set(upcomingCacheKey, { ts: Date.now(), data: upcoming });
      if (upcomingCacheKey === "upcoming:all") saveCacheToDisk();
    } else {
      upcoming = leagues.map((league) => ({
        ...league,
        upcoming: [],
        error: liveResult?.error || "Skipped due to live quota error.",
      }));
    }

    const liveItems = Array.isArray(liveResult?.response)
      ? liveResult.response.map(normalizeLiveItem)
      : [];

    const liveItemsToday = liveItems.filter(
      (item) => dateKeyInTz(item.fixtureDate, LAGOS_TZ) === today
    );

    const resolvedLeagues = await Promise.all(
      leagues.map(async (league) => {
        if (league.apiFootball?.id) return league;
        const id = await resolveLeagueId(apiKey, league);
        return {
          ...league,
          apiFootball: { ...(league.apiFootball || {}), id: id || null },
        };
      })
    );
    const leagueMatchers = getLeagueMatchers(resolvedLeagues);
    const allowedIds = new Set(
      resolvedLeagues.map((league) => league.apiFootball?.id).filter(Boolean)
    );
    const filteredByLeague = liveItemsToday.filter((item) => {
      if (allowedIds.size > 0 && allowedIds.has(item.leagueId)) return true;
      return leagueMatchers.some((matcher) => matcher.match(item));
    });

    const allLiveItems = liveItemsToday.filter((item) => item.isLive).slice(0, 30);
    const filteredLive = filteredByLeague.filter((item) => item.isLive).slice(0, 30);
    const finishedAll = Array.isArray(fixturesRange)
      ? fixturesRange
          .filter(
            (fixture) =>
              dateKeyInTz(fixture?.fixture?.date, LAGOS_TZ) === today
          )
          .filter((fixture) => {
            const status = normalizeText(fixture?.fixture?.status?.short);
            return ["ft", "aet", "pen"].includes(status);
          })
          .map(normalizeLiveItem)
          .slice(0, 30)
      : [];

    const stripRaw = (item) => {
      if (!item || typeof item !== "object") return item;
      const { raw, ...rest } = item;
      return rest;
    };

    return res.json({
      live: {
        items: filteredLive.map(stripRaw),
        allItems: allLiveItems.map(stripRaw),
        error: liveResult?.error || null,
      },
      finished: {
        items: finishedAll.map(stripRaw),
      },
      leagues: upcoming,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Failed to load live sports data.",
      error: err.message,
    });
  }
};

const getSportMatchById = async (req, res) => {
  try {
    const apiKey = process.env.API_FOOTBALL_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: "API_FOOTBALL_KEY not set." });
    }
    const fixtureId = req.params.id;
    const cachedDetails = matchDetailsCache.get(String(fixtureId));
    if (cachedDetails && Date.now() - cachedDetails.ts < MATCH_DETAILS_TTL_MS) {
      return res.json(cachedDetails.data);
    }

    let item = null;
    try {
      const raw = await getFixtureById(apiKey, fixtureId);
      item = Array.isArray(raw?.response) ? raw.response[0] : null;
    } catch (err) {
      if (!isQuotaError(err)) throw err;
      item = findCachedFixtureById(fixtureId);
      if (!item && cachedDetails?.data) {
        return res.json(cachedDetails.data);
      }
    }

    if (!item) {
      return res.status(404).json({ message: "Match not found." });
    }

    const [eventsResult, statsResult, lineupsResult, playersResult] =
      await Promise.allSettled([
        getFixtureEvents(apiKey, fixtureId),
        getFixtureStatistics(apiKey, fixtureId),
        getFixtureLineups(apiKey, fixtureId),
        getFixturePlayers(apiKey, fixtureId),
      ]);

    const events =
      eventsResult.status === "fulfilled" && Array.isArray(eventsResult.value?.response)
        ? eventsResult.value.response.map(normalizeEvent)
        : Array.isArray(item?.events)
        ? item.events.map(normalizeEvent)
        : [];
    const stats =
      statsResult.status === "fulfilled"
        ? normalizeStatistics(statsResult.value?.response)
        : normalizeStatistics(item?.statistics);
    const lineupResponse =
      lineupsResult.status === "fulfilled" && Array.isArray(lineupsResult.value?.response)
        ? lineupsResult.value.response
        : [];
    const playersResponse =
      playersResult.status === "fulfilled" && Array.isArray(playersResult.value?.response)
        ? playersResult.value.response
        : [];
    const lineups =
      normalizeLineups(lineupResponse, playersResponse) || normalizeEmbeddedLineups(item);
    const normalized = normalizeMatch(item, {
      events,
      stats,
      lineups,
      homeFormation: lineupResponse[0]?.formation || "",
      awayFormation: lineupResponse[1]?.formation || "",
    });
    matchDetailsCache.set(String(fixtureId), { ts: Date.now(), data: normalized });
    return res.json(normalized);
  } catch (err) {
    return res.status(500).json({
      message: "Failed to load match data.",
      error: err.message,
    });
  }
};

const listSportDbCountries = async (_req, res) => {
  return res.status(501).json({ message: "SportDB endpoints disabled." });
};

const getSportDbCountry = async (_req, res) => {
  return res.status(501).json({ message: "SportDB endpoints disabled." });
};

const getSportDbCompetitions = async (_req, res) => {
  return res.status(501).json({ message: "SportDB endpoints disabled." });
};

const getSportDbRaw = async (_req, res) => {
  return res.status(501).json({ message: "SportDB endpoints disabled." });
};

const getSportsHealth = async (_req, res) => {
  try {
    const apiKey = process.env.API_FOOTBALL_KEY;
    if (!apiKey) {
      return res.status(500).json({ ok: false, message: "API_FOOTBALL_KEY not set." });
    }
    const today = formatDate(new Date());
    const raw = await fetchJson("/fixtures", apiKey, {
      date: today,
      league: 39,
    });
    return res.json({
      ok: true,
      status: "reachable",
      sample: {
        results: Array.isArray(raw?.response) ? raw.response.length : 0,
      },
    });
  } catch (err) {
    return res.status(502).json({
      ok: false,
      status: "error",
      message: err.message,
    });
  }
};

const lookupLeagues = async (req, res) => {
  try {
    const apiKey = process.env.API_FOOTBALL_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: "API_FOOTBALL_KEY not set." });
    }
    const search = String(req.query.search || "").trim();
    const country = String(req.query.country || "").trim();
    if (!search) {
      return res.status(400).json({ message: "search query is required." });
    }
    const result = await fetchJson("/leagues", apiKey, {
      search,
      country: country || undefined,
    });
    return res.json({
      count: Array.isArray(result?.response) ? result.response.length : 0,
      items: result?.response || [],
    });
  } catch (err) {
    return res.status(500).json({
      message: "Failed to lookup leagues.",
      error: err.message,
    });
  }
};

module.exports = {
  getLiveSports,
  getSportMatchById,
  listSportDbCountries,
  getSportDbCountry,
  getSportDbRaw,
  getSportDbCompetitions,
  getSportsHealth,
  lookupLeagues,
};
