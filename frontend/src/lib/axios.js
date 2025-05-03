// src/lib/axios.js
import axios from "axios";

const instance = axios.create({
  baseURL: import.meta.env.DEV ? "http://localhost:5000/api" : "/api", // <-- all calls become relative to your current host
  withCredentials: true,
});

console.log("🚀 Axios baseURL:", instance.defaults.baseURL);

export default instance;
