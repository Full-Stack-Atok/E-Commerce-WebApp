import axios from "axios";

const instance = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

console.log("🚀 Axios baseURL:", instance.defaults.baseURL);
export default instance;
