import { apiClient } from "./client";

export const createNews = async (payload) => {
  const { data } = await apiClient.post("/news", payload);
  return data;
};
