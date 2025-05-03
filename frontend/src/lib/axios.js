import axios from "axios";

// Read the full API URL from Vite’s env.
// Make sure you’ve set VITE_API_URL=https://rocket-bay-backend.onrender.com/api
// in your Render frontend settings.
const API = import.meta.env.VITE_API_URL;

const instance = axios.create({
  baseURL: API, // ← use the deployed backend URL
  withCredentials: true, // if you need cookies, auth, etc.
});

console.log("🚀 Axios baseURL:", instance.defaults.baseURL);
export default instance;
