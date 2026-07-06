import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API || "https://gstat-ai-backend.onrender.com/api",
});

export default api;