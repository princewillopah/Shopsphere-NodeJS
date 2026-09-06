// Central runtime configuration.
// All values come from Vite build-time env vars (VITE_*), so the frontend is
// host-independent and can be deployed to S3, CloudFront, Netlify, etc. without
// any hardcoded backend URL.

export const API_URL =
  (import.meta.env.VITE_API_URL || '').trim() ||
  (import.meta.env.DEV ? 'http://localhost:5000/api' : '');

if (!import.meta.env.VITE_API_URL && import.meta.env.DEV) {
  // eslint-disable-next-line no-console
  console.warn('VITE_API_URL is not set — using http://localhost:5000/api for development.');
}

// Shown when a product has no image or an image fails to load.
export const PLACEHOLDER_IMAGE =
  import.meta.env.VITE_PLACEHOLDER_IMAGE || 'https://placehold.co/600x400?text=No+Image';
