import axios from 'axios'

function normalizeBase(): string {
  const full = import.meta.env.VITE_API_URL?.trim()
  if (full) return full.replace(/\/+$/, '') // use as-is when provided

  const base = import.meta.env.VITE_API_BASE?.trim()?.replace(/\/+$/, '')
  if (base) {
    if (/\/api(\/v\d+)?$/i.test(base)) return base // already ends with /api or /api/v1
    return `${base}/api/v1`
  }

  return 'http://localhost:8080/api/v1'
}

const baseURL = normalizeBase()
// console.log('API baseURL =', baseURL) // uncomment to verify in Vercel console/devtools

export const api = axios.create({
  baseURL,
  withCredentials: true,
})
