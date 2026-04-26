import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';
const TOKEN_KEY = 'contrib_token';

export const api = axios.create({
  baseURL,
});

// Initialize auth header early so first page requests after reload include token.
if (typeof window !== 'undefined') {
  const bootToken = window.localStorage.getItem(TOKEN_KEY);
  if (bootToken) {
    api.defaults.headers.common.Authorization = `Bearer ${bootToken}`;
  }
}

export function attachAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}
