export const ENV = {
  APP_NAME: 'SDEMS',
  FULL_NAME: 'Secure Digital Document & Evidence Management System',
  TAGLINE: 'Trusted records. Verifiable evidence.',
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  IS_DEV: import.meta.env.DEV,
} as const;
