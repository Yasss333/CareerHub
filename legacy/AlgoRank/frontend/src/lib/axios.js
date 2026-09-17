import axios from "axios";

// export const axiosInstance = s.create({
//   baseURL: import.meta.env.VITE_API_URL + "/api/v1",
//   withCredentials: true,
// });

// export const axiosInstance = axios.create({
//   baseURL: import.meta.env.MODE === "development" ? "http://localhost:8080/api/v1" : " import.meta.env.VITE_API_URL",
//   withCredentials: true,
// });

// export const axiosInstance = axios.create({
//   baseURL: `${import.meta.env.VITE_API_URL}/api/v1`,
//   withCredentials: true,
// });



const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || 
           `${import.meta.env.VITE_API_URL || "http://localhost:8080"}/api/v1`,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      // Ensure headers object exists
      if (!config.headers) {
        config.headers = {};
      }
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
