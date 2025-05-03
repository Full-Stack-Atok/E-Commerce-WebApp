import axios from "axios";

// Read the full API URL from Vite’s env.
// Make sure you’ve set VITE_API_URL=https://rocket-bay-backend.onrender.com/api
// in your Render frontend settings.
const API = import.meta.env.VITE_API_URL;

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // ← full domain + `/api`
  withCredentials: true, // ← include backend cookies
});

console.log("🚀 Axios baseURL:", instance.defaults.baseURL);
export default instance;
