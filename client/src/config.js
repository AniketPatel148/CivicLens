// API configuration for different environments
// In production, VITE_API_URL should point to your Railway backend (e.g., https://your-app.up.railway.app)
const baseUrl = import.meta.env.VITE_API_URL || '';
export const API_BASE = `${baseUrl}/api`;
