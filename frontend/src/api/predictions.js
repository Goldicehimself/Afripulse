import { apiClient } from "./client";

export const fetchPredictions = async ({ page = 1, limit = 10, userName, status } = {}) => {
  const params = { page, limit };
  if (userName) params.userName = userName;
  if (status) params.status = status;
  const { data } = await apiClient.get("/predictions", { params });
  return data;
};

export const createPrediction = async (payload) => {
  const { data } = await apiClient.post("/predictions", payload);
  return data;
};

export const fetchLeaderboard = async (limit = 10) => {
  const { data } = await apiClient.get("/predictions/leaderboard", {
    params: { limit },
  });
  return data;
};
