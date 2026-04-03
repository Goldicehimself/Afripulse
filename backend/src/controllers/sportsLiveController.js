const SPORTDB_BASE = "https://api.sportdb.dev";
const LIVE_TTL_MS = 60 * 1000;
const UPCOMING_TTL_MS = 30 * 60 * 1000;
const QUOTA_COOLDOWN_MS = 60 * 60 * 1000;
const DAILY_REQUEST_LIMIT = 200;

const fs = require("fs");
const path = require("path");

const LEAGUES = [
  {
    key: "epl",
    name: "EPL",
    sportdb: {
      path: "flashscore/football/england:198/premier-league:dYlOSQOD",
    },
  },
  {
    key: "npfl",
    name: "NPFL",
    sportdb: { path: "flashscore/football/nigeria:143/npfl:0YfyoJfj" },
  },
  {
    key: "laliga",
    name: "LaLiga",
    sportdb: { path: "flashscore/football/spain:176/laliga:QVmLl54o" },
  },
  {
    key: "bundesliga",
    name: "Bundesliga",
    sportdb: { path: "flashscore/football/germany:81/bundesliga:W6BOzpK2" },
  },
  {
    key: "ligue1",
    name: "Ligue 1",
    sportdb: { path: "flashscore/football/france:77/ligue-1:KIShoMk3" },
  },
  {
    key: "seriea",
    name: "Serie A",
    sportdb: { path: "flashscore/football/italy:98/serie-a:COuk57Ci" },
  },
  {
    key: "portugal",
    name: "Primeira Liga",
    sportdb: {
      countrySlug: "portugal",
      competitionMatch: [/primeira/i, /liga portugal/i, /liga betclic/i],
    },
  },
  {
    key: "turkey",
    name: "Super Lig",
    sportdb: {
      countrySlug: "turkey",
      competitionMatch: [/super lig/i, /süper/i],
    },
  },
  {
    key: "netherlands",
    name: "Eredivisie",
    sportdb: {
      countrySlug: "netherlands",
      competitionMatch: [/eredivisie/i],
    },
  },
  {
    key: "belgium",
    name: "Pro League",
    sportdb: {
      countrySlug: "belgium",
      competitionMatch: [/pro league/i, /jupiler/i, /first division/i],
    },
  },
];

const ensureBudget = () => {
  const today = new Date().toISOString().slice(0, 10);
  if (requestBudget.date !== today) {
    requestBudget = { date: today, count: 0 };
  }
  if (requestBudget.count >= DAILY_REQUEST_LIMIT) {
    throw new Error("Quota throttle: daily request limit reached.");
  }
  requestBudget.count += 1;
};

const fetchJson = async (url, options = {}) => {
  ensureBudget();
  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Request failed (${res.status}): ${text}`);
  }
  return res.json();
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const competitionPathCache = new Map();
const liveCache = new Map();
const upcomingCache = new Map();
let lastQuotaErrorAt = null;
let requestBudget = { date: "", count: 0 };

const CACHE_FILE = path.join(__dirname, "..", "utils", "sportdb_cache.json");

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
    fs.writeFileSync(
      CACHE_FILE,
      JSON.stringify({ live, upcoming }, null, 2),
      "utf8"
    );
  } catch (_) {}
};

loadCacheFromDisk();

const pickField = (obj, keys) => {
  for (const key of keys) {
    if (obj && obj[key] !== undefined && obj[key] !== null && obj[key] !== "") {
      return obj[key];
    }
  }
  return null;
};

const resolveCompetitionPath = async (league, apiKey, baseUrl) => {
  if (!league) return null;
  const directPath = league?.sportdb?.path;
  if (directPath) return directPath;
  const countrySlug = league?.sportdb?.countrySlug;
  if (!countrySlug) return null;

  const cacheKey = `${countrySlug}:${league.key}`;
  if (competitionPathCache.has(cacheKey)) {
    return competitionPathCache.get(cacheKey);
  }

  const sport = "flashscore/football";
  const countriesUrl = `${baseUrl}/api/${sport}`;
  const countries = await fetchJson(countriesUrl, {
    headers: { "X-API-Key": apiKey },
  });
  const country = Array.isArray(countries)
    ? countries.find((item) => item?.slug === countrySlug)
    : null;
  if (!country?.competitions) {
    competitionPathCache.set(cacheKey, null);
    return null;
  }

  const competitionsPath = String(country.competitions || "").replace(/^\/+/, "");
  const competitionsUrl = `${baseUrl}${
    competitionsPath.startsWith("api/") ? "/" : "/api/"
  }${competitionsPath}`;
  const competitions = await fetchJson(competitionsUrl, {
    headers: { "X-API-Key": apiKey },
  });
  const list =
    competitions?.competitions ||
    competitions?.data ||
    competitions?.items ||
    (Array.isArray(competitions) ? competitions : []);

  const items = Array.isArray(list) ? list : [];
  const matchers = league?.sportdb?.competitionMatch || [];
  const patterns = Array.isArray(matchers) ? matchers : [matchers];

  const pickName = (item) =>
    pickField(item, ["name", "title", "competition", "league", "slug"]);
  const pickPath = (item) =>
    pickField(item, ["path", "url", "competition", "link"]);

  let match = null;
  if (patterns.length > 0) {
    match = items.find((item) => {
      const name = String(pickName(item) || "");
      return patterns.some((pattern) =>
        pattern instanceof RegExp ? pattern.test(name) : name.includes(pattern)
      );
    });
  }

  const resolvedPath = pickPath(match) || pickPath(items[0]) || null;
  competitionPathCache.set(cacheKey, resolvedPath);
  return resolvedPath;
};

const normalizeFixture = (fixture) => {
  const homeTeam = pick(fixture, [
    ["homeTeam"],
    ["home_team"],
    ["home", "name"],
    ["team_home"],
    ["strHomeTeam"],
    ["homeName"],
  ]);
  const awayTeam = pick(fixture, [
    ["awayTeam"],
    ["away_team"],
    ["away", "name"],
    ["team_away"],
    ["strAwayTeam"],
    ["awayName"],
  ]);
  const date = pick(fixture, [
    ["date"],
    ["dateEvent"],
    ["date_event"],
    ["strDate"],
    ["dateEventLocal"],
    ["match_date"],
    ["fixture_date"],
    ["utc_date"],
    ["startDateTimeUtc"],
  ]);
  const time = pick(fixture, [
    ["time"],
    ["strTime"],
    ["timeLocal"],
    ["strTimeLocal"],
    ["kickoff"],
    ["utc_time"],
    ["startTime"],
  ]);

  return {
    id: pick(fixture, [
      ["id"],
      ["match_id"],
      ["fixture_id"],
      ["idEvent"],
      ["eventId"],
    ]),
    name: pick(fixture, [["name"], ["strEvent"], ["match_name"]]),
    homeTeam,
    awayTeam,
    date: date || null,
    time: time || null,
    homeScore: pick(fixture, [["homeScore"], ["home_score"]]),
    awayScore: pick(fixture, [["awayScore"], ["away_score"]]),
    thumb: pick(fixture, [["thumb"], ["image"], ["logo"]]),
    status: pick(fixture, [["status"], ["state"], ["strStatus"]]),
  };
};

const pickSeasonEntry = (competition) => {
  const seasons = competition?.seasons;
  if (!Array.isArray(seasons) || seasons.length === 0) return null;
  const current = seasons.find(
    (s) => s?.current || s?.is_current || s?.isCurrent || s?.active
  );
  return current || seasons[0] || null;
};

const getSportDbFixtures = async (league, apiKey, baseUrl) => {
  const path = await resolveCompetitionPath(league, apiKey, baseUrl);
  if (!path) {
    return { upcoming: [], error: "SPORTDB competition not configured." };
  }

  let seasonEntry = null;
  if (league.sportdb.season) {
    seasonEntry = { season: league.sportdb.season };
  } else {
    const compUrl = `${baseUrl}/api/${path}`;
    const compData = await fetchJson(compUrl, {
      headers: { "X-API-Key": apiKey },
    });
    seasonEntry = pickSeasonEntry(compData);
  }

  if (!seasonEntry) {
    return { upcoming: [], error: "No season found for competition." };
  }

  const seasonLabel =
    seasonEntry.season || seasonEntry.slug || seasonEntry.id || seasonEntry.name || null;

  const fixturesPath =
    seasonEntry.fixtures ||
    (seasonLabel ? `/api/${path}/${seasonLabel}/fixtures` : null);

  if (!fixturesPath) {
    return { upcoming: [], error: "Fixtures path not available." };
  }

  const fixturesUrl = `${baseUrl}${fixturesPath.startsWith("/") ? "" : "/"}${fixturesPath}`;
  const fixtureData = await fetchJson(fixturesUrl, {
    headers: { "X-API-Key": apiKey },
  });
  const items =
    fixtureData?.fixtures ||
    fixtureData?.matches ||
    fixtureData?.data ||
    (Array.isArray(fixtureData) ? fixtureData : []);
  const fixtures = Array.isArray(items) ? items.map(normalizeFixture) : [];
  return { upcoming: fixtures, season: seasonLabel };
};

const getLiveMatches = async (apiKey, baseUrl) => {
  const url = `${baseUrl}/api/flashscore/football/live`;
  return fetchJson(url, {
    headers: {
      "X-API-Key": apiKey,
    },
  });
};

const fetchSportDbPath = async (apiKey, baseUrl, path) => {
  const url = `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
  return fetchJson(url, {
    headers: {
      "X-API-Key": apiKey,
    },
  });
};

const getSportDbMatch = async (apiKey, baseUrl, id) => {
  const detailsPath = `/api/flashscore/match/${id}/details`;
  const details = await fetchSportDbPath(apiKey, baseUrl, detailsPath);

  let lineups = null;
  let stats = null;
  let events = null;

  const links = details?.links || {};
  const lineupsPath = links.lineups || `/api/flashscore/match/${id}/lineups`;
  const statsPath = links.stats || `/api/flashscore/match/${id}/stats`;
  const eventsPath = links.details || detailsPath;

  try {
    lineups = await fetchSportDbPath(apiKey, baseUrl, lineupsPath);
  } catch (_) {}
  try {
    stats = await fetchSportDbPath(apiKey, baseUrl, statsPath);
  } catch (_) {}
  try {
    if (eventsPath) {
      events = await fetchSportDbPath(apiKey, baseUrl, eventsPath);
    }
  } catch (_) {}

  return { details, lineups, stats, events };
};

const getDeep = (obj, path) => {
  return path.reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : null), obj);
};

const pick = (obj, paths) => {
  for (const path of paths) {
    const value = getDeep(obj, path);
    if (value !== null && value !== undefined && value !== "") return value;
  }
  return null;
};

const formatLiveStatus = (stage) => {
  if (!stage) return "";
  const value = String(stage).toLowerCase();
  if (/^\d+$/.test(value)) return "";
  if (value === "ht" || value.includes("half")) return "HT";
  if (value === "ft" || value.includes("full") || value.includes("finished"))
    return "FT";
  if (value.includes("postponed")) return "POSTP";
  if (value.includes("cancelled") || value.includes("canceled")) return "CANC";
  if (value.includes("scheduled")) return "NS";
  if (value.includes("live") || value.includes("in_progress")) return "LIVE";
  return String(stage);
};

const isLiveStage = (stageValue) => {
  if (!stageValue) return false;
  const value = String(stageValue).toLowerCase();
  if (value.includes("finished")) return false;
  if (value.includes("scheduled")) return false;
  if (value.includes("postponed")) return false;
  if (value.includes("cancelled") || value.includes("canceled")) return false;
  if (value.includes("ht") || value.includes("half")) return true;
  if (value.includes("live") || value.includes("in_progress")) return true;
  return false;
};

const isFinishedStage = (stageValue) => {
  if (!stageValue) return false;
  const value = String(stageValue).toLowerCase();
  if (value === "ft") return true;
  if (value.includes("full")) return true;
  if (value.includes("finished")) return true;
  return false;
};

const normalizeLiveItem = (item) => {
  const homeName = pick(item, [
    ["homeTeam"],
    ["home_team"],
    ["home", "name"],
    ["team_home"],
    ["strHomeTeam"],
    ["homeName"],
  ]);
  const awayName = pick(item, [
    ["awayTeam"],
    ["away_team"],
    ["away", "name"],
    ["team_away"],
    ["strAwayTeam"],
    ["awayName"],
  ]);
  const homeScore = pick(item, [
    ["homeScore"],
    ["home_score"],
    ["home", "score"],
    ["intHomeScore"],
  ]);
  const awayScore = pick(item, [
    ["awayScore"],
    ["away_score"],
    ["away", "score"],
    ["intAwayScore"],
  ]);
  const status = pick(item, [["status"], ["state"], ["strStatus"]]);
  const gameTime = pick(item, [["gameTime"], ["time"], ["minute"], ["strProgress"]]);
  const eventStage = pick(item, [["eventStage"], ["eventStageType"], ["eventStageId"]]);
  const competition = pick(item, [
    ["competition"],
    ["league"],
    ["strLeague"],
    ["league_name"],
    ["tournamentName"],
  ]);
  const id = pick(item, [
    ["id"],
    ["match_id"],
    ["idEvent"],
    ["event_id"],
    ["eventId"],
  ]);

  let minute = null;
  const numericTime = Number(gameTime);
  if (!Number.isNaN(numericTime) && numericTime >= 0) {
    minute = `${numericTime}'`;
  }

  const stageStatus = formatLiveStatus(status || eventStage);
  const liveFlag =
    isLiveStage(status) ||
    isLiveStage(eventStage) ||
    (!Number.isNaN(numericTime) && numericTime >= 0);
  const finishedFlag =
    isFinishedStage(status) || isFinishedStage(eventStage) || stageStatus === "FT";

  return {
    id,
    homeName,
    awayName,
    homeScore,
    awayScore,
    status: stageStatus,
    minute: minute || "",
    competition,
    isLive: liveFlag,
    isFinished: finishedFlag,
    raw: item,
  };
};

const leagueMatchers = [
  {
    key: "epl",
    match: (name) =>
      /england/i.test(name) && /premier league/i.test(name),
  },
  {
    key: "laliga",
    match: (name) => /spain/i.test(name) && /laliga/i.test(name),
  },
  {
    key: "bundesliga",
    match: (name) => /germany/i.test(name) && /bundesliga/i.test(name),
  },
  {
    key: "ligue1",
    match: (name) => /france/i.test(name) && /ligue 1/i.test(name),
  },
  {
    key: "seriea",
    match: (name) => /italy/i.test(name) && /serie a/i.test(name),
  },
  {
    key: "npfl",
    match: (name) => /nigeria/i.test(name) && /npfl/i.test(name),
  },
  {
    key: "portugal",
    match: (name) =>
      /portugal/i.test(name) && (/primeira/i.test(name) || /liga portugal/i.test(name)),
  },
  {
    key: "turkey",
    match: (name) => /turkey/i.test(name) && (/super lig/i.test(name) || /süper/i.test(name)),
  },
  {
    key: "netherlands",
    match: (name) => /netherlands/i.test(name) && /eredivisie/i.test(name),
  },
  {
    key: "belgium",
    match: (name) =>
      /belgium/i.test(name) && (/pro league/i.test(name) || /jupiler/i.test(name)),
  },
];

const filterLiveByLeagues = (items, leagueKeys) => {
  if (!Array.isArray(leagueKeys) || leagueKeys.length === 0) return items;
  return items.filter((item) => {
    if (!item.isLive) return false;
    const name = item.competition || "";
    const matcher = leagueMatchers.find((m) => leagueKeys.includes(m.key));
    if (!matcher) return true;
    return leagueMatchers.some(
      (m) => leagueKeys.includes(m.key) && m.match(name)
    );
  });
};

const filterFinishedByLeagues = (items, leagueKeys) => {
  if (!Array.isArray(leagueKeys) || leagueKeys.length === 0) return items;
  return items.filter((item) => {
    if (!item.isFinished) return false;
    const name = item.competition || "";
    const matcher = leagueMatchers.find((m) => leagueKeys.includes(m.key));
    if (!matcher) return true;
    return leagueMatchers.some(
      (m) => leagueKeys.includes(m.key) && m.match(name)
    );
  });
};

const normalizeMatch = (raw) => {
  const details = raw?.details;
  const match =
    details?.match ||
    details?.event ||
    details?.data ||
    details ||
    raw?.match ||
    raw?.data ||
    raw?.event ||
    raw;
  const homeName = pick(match, [
    ["homeTeam"],
    ["home_team"],
    ["home", "name"],
    ["team_home"],
    ["strHomeTeam"],
    ["homeName"],
  ]);
  const awayName = pick(match, [
    ["awayTeam"],
    ["away_team"],
    ["away", "name"],
    ["team_away"],
    ["strAwayTeam"],
    ["awayName"],
  ]);
  const homeScoreRaw = pick(match, [
    ["homeScore"],
    ["home_score"],
    ["home", "score"],
    ["intHomeScore"],
    ["homeFullTimeScore"],
    ["homeResult"],
    ["homeGoals"],
    ["score", "home"],
    ["result", "home"],
    ["goals", "home"],
    ["homeScoreCurrent"],
    ["homeFullTime"],
  ]);
  const awayScoreRaw = pick(match, [
    ["awayScore"],
    ["away_score"],
    ["away", "score"],
    ["intAwayScore"],
    ["awayFullTimeScore"],
    ["awayResult"],
    ["awayGoals"],
    ["score", "away"],
    ["result", "away"],
    ["goals", "away"],
    ["awayScoreCurrent"],
    ["awayFullTime"],
  ]);
  const homeScore =
    homeScoreRaw === null || homeScoreRaw === undefined || homeScoreRaw === ""
      ? null
      : Number(homeScoreRaw);
  const awayScore =
    awayScoreRaw === null || awayScoreRaw === undefined || awayScoreRaw === ""
      ? null
      : Number(awayScoreRaw);
  const competition = pick(match, [
    ["competition"],
    ["league"],
    ["strLeague"],
    ["league_name"],
    ["tournamentName"],
    ["tournament"],
  ]);
  const venue = pick(match, [["venue"], ["stadium"], ["strVenue"]]);
  const status = pick(match, [["status"], ["state"], ["strStatus"]]);
  const minute = pick(match, [["minute"], ["time"], ["strProgress"], ["matchTime"]]);
  const homeLogo = pick(match, [["homeLogo"], ["homeBadge"], ["strHomeTeamBadge"]]);
  const awayLogo = pick(match, [["awayLogo"], ["awayBadge"], ["strAwayTeamBadge"]]);

  const normalizeStats = (stats) => {
    if (!Array.isArray(stats)) return [];
    const period =
      stats.find((item) => /match/i.test(item?.period || "")) || stats[0];
    const list = Array.isArray(period?.stats) ? period.stats : [];
    const seen = new Set();
    return list
      .map((stat) => ({
        label: stat.statName || stat.label || "",
        home: stat.homeValue ?? stat.home ?? "",
        away: stat.awayValue ?? stat.away ?? "",
      }))
      .filter((stat) => stat.label)
      .filter((stat) => {
        if (seen.has(stat.label)) return false;
        seen.add(stat.label);
        return true;
      });
  };

  return {
    id: pick(match, [["id"], ["match_id"], ["idEvent"], ["event_id"]]),
    competition,
    stage:
      pick(match, [["stage"], ["round"], ["strRound"], ["tournamentStage"]]) ||
      "",
    venue: venue || "",
    status: status || "",
    minute: minute || "",
    half: pick(match, [["half"], ["period"], ["strHalf"]]) || "",
    home: {
      name: homeName || "",
      formation: pick(match, [["homeFormation"], ["home_formation"]]) || "",
      score: homeScore,
      badgeUrl:
        pick(match, [["homeBadge"], ["home_badge"], ["strHomeTeamBadge"]]) ||
        homeLogo ||
        "",
    },
    away: {
      name: awayName || "",
      formation: pick(match, [["awayFormation"], ["away_formation"]]) || "",
      score: awayScore,
      badgeUrl:
        pick(match, [["awayBadge"], ["away_badge"], ["strAwayTeamBadge"]]) ||
        awayLogo ||
        "",
    },
    events: Array.isArray(match?.events)
      ? match.events
      : Array.isArray(raw?.events)
      ? raw.events
      : Array.isArray(raw?.details?.events)
      ? raw.details.events
      : match?.events || raw?.events || [],
    stats: normalizeStats(
      Array.isArray(match?.stats)
        ? match.stats
        : Array.isArray(raw?.details?.stats)
        ? raw.details.stats
        : Array.isArray(raw?.stats)
        ? raw.stats
        : raw?.details?.stats || raw?.stats || match?.stats || []
    ),
    lineups:
      raw?.lineups ||
      match?.lineups ||
      raw?.details?.lineups ||
      match?.lineup ||
      raw?.lineup ||
      null,
    prediction: match?.prediction || null,
    topPredictors: Array.isArray(match?.topPredictors) ? match.topPredictors : [],
    reactions: match?.reactions || { fire: 0, cap: 0, brain: 0, angry: 0 },
    raw,
  };
};

const getLiveSports = async (req, res) => {
  try {
    const sportDbKey = process.env.SPORTDB_API_KEY;
    const sportDbBase = process.env.SPORTDB_BASE_URL || SPORTDB_BASE;

    if (!sportDbKey) {
      return res.status(500).json({ message: "SPORTDB_API_KEY not set." });
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
    if (cachedLive && Date.now() - cachedLive.ts < LIVE_TTL_MS) {
      liveResult = cachedLive.data;
    } else {
      const inCooldown =
        lastQuotaErrorAt && Date.now() - lastQuotaErrorAt < QUOTA_COOLDOWN_MS;
      if (inCooldown) {
        liveResult = { error: "Quota cooldown active. Serving cached data." };
      } else {
        liveResult = await (async () => {
          try {
            return await getLiveMatches(sportDbKey, sportDbBase);
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
      (String(liveResult.error).includes("402") ||
        String(liveResult.error).includes("limit") ||
        String(liveResult.error).includes("Upgrade"));
    if (skipUpcoming) lastQuotaErrorAt = Date.now();

    let upcoming = [];
    const upcomingCacheKey = `upcoming:${leagues.map((l) => l.key).sort().join(",")}`;
    const cachedUpcoming = upcomingCache.get(upcomingCacheKey);
    if (cachedUpcoming && Date.now() - cachedUpcoming.ts < UPCOMING_TTL_MS) {
      upcoming = cachedUpcoming.data;
    } else if (!skipUpcoming) {
      for (const league of leagues) {
        try {
          const result = await getSportDbFixtures(league, sportDbKey, sportDbBase);
          upcoming.push({ ...league, ...result });
        } catch (err) {
          upcoming.push({ ...league, upcoming: [], error: err.message });
        }
        // Free tier is limited to ~3 req/s; keep a small gap.
        await sleep(450);
      }
      upcomingCache.set(upcomingCacheKey, { ts: Date.now(), data: upcoming });
      if (upcomingCacheKey === "upcoming:all") saveCacheToDisk();
    } else {
      upcoming = leagues.map((league) => ({
        ...league,
        upcoming: [],
        error: liveResult?.error || "Skipped due to live quota error.",
      }));
    }

    const liveItems = Array.isArray(liveResult?.matches)
      ? liveResult.matches.map(normalizeLiveItem)
      : Array.isArray(liveResult?.data)
      ? liveResult.data.map(normalizeLiveItem)
      : Array.isArray(liveResult)
      ? liveResult.map(normalizeLiveItem)
      : [];

    const filteredLive = filterLiveByLeagues(liveItems, requested).slice(0, 30);
    const filteredFinished = filterFinishedByLeagues(liveItems, requested).slice(0, 30);

    return res.json({
      live: {
        raw: liveResult,
        items: filteredLive,
        error: liveResult?.error || null,
      },
      finished: {
        items: filteredFinished,
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
    const sportDbKey = process.env.SPORTDB_API_KEY;
    const sportDbBase = process.env.SPORTDB_BASE_URL || SPORTDB_BASE;
    if (!sportDbKey) {
      return res.status(500).json({ message: "SPORTDB_API_KEY not set." });
    }
    const raw = await getSportDbMatch(sportDbKey, sportDbBase, req.params.id);
    const normalized = normalizeMatch(raw);

    // Fallback: enrich from live list when scores or competition are missing
    if (
      (normalized.home?.score === null || normalized.away?.score === null) ||
      !normalized.competition
    ) {
      try {
        const liveResult = await getLiveMatches(sportDbKey, sportDbBase);
        const liveItems = Array.isArray(liveResult?.matches)
          ? liveResult.matches.map(normalizeLiveItem)
          : Array.isArray(liveResult?.data)
          ? liveResult.data.map(normalizeLiveItem)
          : Array.isArray(liveResult)
          ? liveResult.map(normalizeLiveItem)
          : [];
        const liveMatch = liveItems.find(
          (item) => String(item.id) === String(req.params.id)
        );
        if (liveMatch) {
          if (normalized.home?.score === null) normalized.home.score = liveMatch.homeScore ?? null;
          if (normalized.away?.score === null) normalized.away.score = liveMatch.awayScore ?? null;
          if (!normalized.competition) normalized.competition = liveMatch.competition || "";
          if (!normalized.minute) normalized.minute = liveMatch.minute || "";
          if (!normalized.status) normalized.status = liveMatch.status || "";
          if (!normalized.home?.name) normalized.home.name = liveMatch.homeName || "";
          if (!normalized.away?.name) normalized.away.name = liveMatch.awayName || "";
        }
      } catch (_) {}
    }

    if (req.query.debug === "1") {
      return res.json({ normalized, raw });
    }
    return res.json(normalized);
  } catch (err) {
    return res.status(500).json({
      message: "Failed to load match data.",
      error: err.message,
    });
  }
};

const listSportDbCountries = async (req, res) => {
  try {
    const sportDbKey = process.env.SPORTDB_API_KEY;
    const sportDbBase = process.env.SPORTDB_BASE_URL || SPORTDB_BASE;
    if (!sportDbKey) {
      return res.status(500).json({ message: "SPORTDB_API_KEY not set." });
    }
    const sport = "flashscore/football";
    const url = `${sportDbBase}/api/${sport}/countries`;
    const data = await fetchJson(url, { headers: { "X-API-Key": sportDbKey } });
    return res.json(data);
  } catch (err) {
    return res.status(500).json({
      message: "Failed to load countries.",
      error: err.message,
    });
  }
};

const getSportDbCountry = async (req, res) => {
  try {
    const sportDbKey = process.env.SPORTDB_API_KEY;
    const sportDbBase = process.env.SPORTDB_BASE_URL || SPORTDB_BASE;
    if (!sportDbKey) {
      return res.status(500).json({ message: "SPORTDB_API_KEY not set." });
    }
    const sport = "flashscore/football";
    const slug = req.params.slug;
    const url = `${sportDbBase}/api/${sport}/${slug}`;
    const data = await fetchJson(url, { headers: { "X-API-Key": sportDbKey } });
    return res.json(data);
  } catch (err) {
    return res.status(500).json({
      message: "Failed to load country competitions.",
      error: err.message,
    });
  }
};

const getSportDbCompetitions = async (req, res) => {
  try {
    const sportDbKey = process.env.SPORTDB_API_KEY;
    const sportDbBase = process.env.SPORTDB_BASE_URL || SPORTDB_BASE;
    if (!sportDbKey) {
      return res.status(500).json({ message: "SPORTDB_API_KEY not set." });
    }
    const sport = "flashscore/football";
    const slug = req.params.slug;

    const countriesUrl = `${sportDbBase}/api/${sport}`;
    const countries = await fetchJson(countriesUrl, {
      headers: { "X-API-Key": sportDbKey },
    });
    const match = Array.isArray(countries)
      ? countries.find((item) => item.slug === slug)
      : null;
    if (!match?.competitions) {
      return res.status(404).json({ message: "Country not found." });
    }

    const competitionsPath = String(match.competitions || "").replace(/^\/+/, "");
    const competitionsUrl = `${sportDbBase}${
      competitionsPath.startsWith("api/") ? "/" : "/api/"
    }${competitionsPath}`;
    const data = await fetchJson(competitionsUrl, {
      headers: { "X-API-Key": sportDbKey },
    });
    return res.json(data);
  } catch (err) {
    return res.status(500).json({
      message: "Failed to load competitions.",
      error: err.message,
    });
  }
};

const getSportDbRaw = async (req, res) => {
  try {
    const sportDbKey = process.env.SPORTDB_API_KEY;
    const sportDbBase = process.env.SPORTDB_BASE_URL || SPORTDB_BASE;
    if (!sportDbKey) {
      return res.status(500).json({ message: "SPORTDB_API_KEY not set." });
    }
    const path = String(req.query.path || "").trim();
    if (!path || path.startsWith("/") || path.includes("..")) {
      return res.status(400).json({ message: "Invalid path." });
    }
    if (!/^[a-z0-9/_:=?&.-]+$/i.test(path)) {
      return res.status(400).json({ message: "Invalid path." });
    }
    const page = String(req.query.page || "").trim();
    const withPage =
      page && !path.includes("?") ? `${path}?page=${encodeURIComponent(page)}` : path;
    const url = `${sportDbBase}/api/${withPage}`;
    const data = await fetchJson(url, { headers: { "X-API-Key": sportDbKey } });
    return res.json(data);
  } catch (err) {
    return res.status(500).json({
      message: "Failed to load SportDB data.",
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
};
