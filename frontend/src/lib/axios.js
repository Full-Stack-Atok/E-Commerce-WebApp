// src/lib/axios.js
import axios from "axios";

const instance = axios.create({
  baseURL: import.meta.env.DEV
    ? "http://localhost:5000/api"
    : import.meta.env.VITE_PROD_API_URL,
  withCredentials: true,
});

// Debug: confirm where requests will go
console.log("🚀 Axios baseURL:", instance.defaults.baseURL);

export default instance;
