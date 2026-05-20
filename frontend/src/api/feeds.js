import { apiClient } from "./client";

export const fetchFeed = async (feedKey, limit = 20) => {
  const { data } = await apiClient.get(`/feeds/${feedKey}`, {
    params: { limit },
  });
  return data;
};

export const refreshFeed = async (feedKey) => {
  const { data } = await apiClient.post(`/feeds/${feedKey}/refresh`);
  return data;
};

export const refreshAllFeeds = async () => {
  const { data } = await apiClient.post("/feeds/refresh/all");
  return data;
};
