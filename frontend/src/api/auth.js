import { apiClient } from "./client";

export const loginAdmin = async (email, password) => {
  const { data } = await apiClient.post("/auth/login", { email, password });
  return data;
};

export const loginUser = async (email, password) => {
  const { data } = await apiClient.post("/auth/login", { email, password });
  return data;
};

export const registerUser = async ({ name, email, password, handle }) => {
  const { data } = await apiClient.post("/auth/register", {
    name,
    email,
    password,
    handle,
  });
  return data;
};
