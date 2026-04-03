import { apiClient } from "./client";

export const createEntertainment = async (payload) => {
  const { data } = await apiClient.post("/entertainment", payload);
  return data;
};
