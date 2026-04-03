import { apiClient } from "./client";

export const fetchProfile = async () => {
  const { data } = await apiClient.get("/profile");
  return data;
};

export const updateProfile = async (payload) => {
  const { data } = await apiClient.put("/profile", payload);
  return data;
};
