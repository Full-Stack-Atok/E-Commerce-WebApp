import axios from "axios";

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // e.g. https://rocket-bay-backend.onrender.com/api
  withCredentials: true, // ← include cookies
});

console.log("🚀 Axios baseURL:", instance.defaults.baseURL);
export default instance;
