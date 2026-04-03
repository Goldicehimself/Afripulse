import { apiClient } from "./client";

export const fetchShorts = async (limit = 20) => {
  const { data } = await apiClient.get("/shorts", { params: { limit } });
  return data;
};

export const createShort = async (payload) => {
  const { data } = await apiClient.post("/shorts", payload);
  return data;
};

export const deleteShort = async (id) => {
  const { data } = await apiClient.delete(`/shorts/${id}`);
  return data;
};
