import axios from "axios";
import { backendTestApi } from "../utils/global/keys";
import { backendApi } from "../utils/global/keys";

const userApi = axios.create({
  baseURL: `${backendApi}/api`,
  withCredentials: true,
});

// OPTIONAL: Request Interceptor
userApi.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

userApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const err = error?.response;

    if (err?.status === 401) {
      console.warn("Unauthorized response received from API.");
    }

    return Promise.reject(error);
  }
);

export default userApi;
