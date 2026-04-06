import { apiClient } from "./client";

export const fetchPosts = async ({ page = 1, limit = 10, category, query } = {}) => {
  const params = { page, limit };
  if (category && category !== "all") {
    params.category = category;
  }
  if (query) {
    params.q = query;
  }
  const { data } = await apiClient.get("/posts", { params });
  return data;
};

export const fetchPostById = async (id) => {
  const { data } = await apiClient.get(`/posts/${id}`);
  return data;
};

export const fetchTrending = async (limit = 7) => {
  const { data } = await apiClient.get("/posts/trending", {
    params: { limit },
  });
  return data;
};

export const reactToPost = async (id, type) => {
  const { data } = await apiClient.post(`/posts/${id}/react`, { type });
  return data;
};

export const createPost = async (payload) => {
  const { data } = await apiClient.post("/posts", payload);
  return data;
};

export const deletePost = async (id) => {
  const { data } = await apiClient.delete(`/posts/${id}`);
  return data;
};
