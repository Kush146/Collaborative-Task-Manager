import axios from 'axios'

// ✅ 1. If full API URL is provided, use it directly (e.g. with /api/v1)
// ✅ 2. Otherwise, fall back to a base + /api/v1 or localhost for dev.
const base =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') ||
  (import.meta.env.VITE_API_BASE
    ? `${import.meta.env.VITE_API_BASE.replace(/\/$/, '')}/api/v1`
    : 'http://localhost:8080/api/v1')

export const api = axios.create({
  baseURL: base,
  withCredentials: true, // send cookies for auth
})
