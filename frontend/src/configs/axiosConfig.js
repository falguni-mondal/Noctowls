import axios from "axios";
import { backendTestApi } from "../utils/global/keys";

const api = axios.create({
  baseURL: backendTestApi,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// OPTIONAL: Request Interceptor
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const err = error?.response;

    if (err?.status === 401) {
      console.warn("Unauthorized response received from API.");
    }

    return Promise.reject(error);
  }
);

export default api;
