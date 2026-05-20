const defaultReactions = () => ({
  fire: 0,
  cap: 0,
  brain: 0,
  angry: 0,
});

const defaultProfileStats = () => ({
  predictionPoints: 0,
  accuracyRate: 0,
  reactionsGiven: 0,
  dailyStreak: 0,
});

const defaultTeam = (team = {}) => ({
  name: team.name,
  formation: team.formation || "",
  score: Number(team.score || 0),
  badgeUrl: team.badgeUrl || "",
});

const defaultMatchPrediction = (prediction = {}) => ({
  userPick: prediction.userPick || "",
  points: Number(prediction.points || 0),
  totals: {
    nigeria: Number(prediction.totals?.nigeria || 0),
    draw: Number(prediction.totals?.draw || 0),
    ghana: Number(prediction.totals?.ghana || 0),
  },
  count: prediction.count || "0",
});

const withMongoId = (record) => {
  if (!record) return record;
  return { ...record, _id: record.id };
};

const withMongoIds = (records) => records.map(withMongoId);

module.exports = {
  defaultReactions,
  defaultProfileStats,
  defaultTeam,
  defaultMatchPrediction,
  withMongoId,
  withMongoIds,
};
