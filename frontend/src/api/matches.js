import { apiClient } from "./client";

export const fetchMatches = async ({ page = 1, limit = 20 } = {}) => {
  const { data } = await apiClient.get("/matches", { params: { page, limit } });
  return data;
};

export const fetchMatchById = async (id) => {
  const { data } = await apiClient.get(`/matches/${id}`);
  return data;
};

export const createMatch = async (payload) => {
  const { data } = await apiClient.post("/matches", payload);
  return data;
};

export const deleteMatch = async (id) => {
  const { data } = await apiClient.delete(`/matches/${id}`);
  return data;
};
