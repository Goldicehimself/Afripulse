import { apiClient } from "./client";

export const fetchLiveSports = async (leagues = []) => {
  const params = {};
  if (leagues.length > 0) {
    params.leagues = leagues.join(",");
  }
  const { data } = await apiClient.get("/sports/live", { params });
  return data;
};

export const fetchSportMatchById = async (id) => {
  const { data } = await apiClient.get(`/sports/match/${id}`);
  return data;
};
