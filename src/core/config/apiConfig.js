export const DEFAULT_API_BASE_URL = 'http://localhost:8000/api';

export function getApiBaseUrl() {
  return process.env.REACT_APP_API_URL || DEFAULT_API_BASE_URL;
}

export function getBackendOrigin() {
  const apiUrl = getApiBaseUrl();
  // Convierte "http://host:port/api" o ".../api/" a "http://host:port"
  return apiUrl.replace(/\/?api\/?$/, '');
}

export function toAbsoluteBackendUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;

  const origin = getBackendOrigin();
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${origin}${path}`;
}
