const express = require("express");
const { listSports, createSports } = require("../controllers/sportsController");
const {
  getLiveSports,
  getSportMatchById,
  listSportDbCountries,
  getSportDbCountry,
  getSportDbRaw,
  getSportDbCompetitions,
  getSportsHealth,
  lookupLeagues,
} = require("../controllers/sportsLiveController");

const router = express.Router();

router.get("/health", getSportsHealth);
router.get("/leagues", lookupLeagues);
router.get("/live", getLiveSports);
router.get("/match/:id", getSportMatchById);
router.get("/sportdb/countries", listSportDbCountries);
router.get("/sportdb/countries/:slug", getSportDbCountry);
router.get("/sportdb/competitions/:slug", getSportDbCompetitions);
router.get("/sportdb/raw", getSportDbRaw);
router.get("/", listSports);
router.post("/", createSports);

module.exports = router;
