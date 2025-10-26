import axios from 'axios';

const base =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.VITE_API_BASE
    ? `${import.meta.env.VITE_API_BASE.replace(/\/$/, '')}/api/v1`
    : 'http://localhost:8080/api/v1'); // final fallback for dev

export const api = axios.create({
  baseURL: base,
  withCredentials: true, // cookies for auth
});
