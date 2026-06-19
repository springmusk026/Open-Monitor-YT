import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error || error.message || "Unknown error";
    console.error(`[API] ${error.config?.url}:`, message);
    return Promise.reject(error);
  }
);

export default api;
