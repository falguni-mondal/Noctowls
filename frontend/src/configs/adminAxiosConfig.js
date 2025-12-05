import axios from "axios";
import { backendTestApi } from "../utils/global/keys";

const adminApi = axios.create({
  baseURL: `${backendTestApi}/api/admin`,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// OPTIONAL: Request Interceptor
adminApi.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const err = error?.response;

    if (err?.status === 401) {
      console.warn("Unauthorized response received from API.");
    }

    return Promise.reject(error);
  }
);

export default adminApi;
