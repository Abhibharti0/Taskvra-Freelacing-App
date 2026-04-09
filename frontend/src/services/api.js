import axios from 'axios';

// Get API URL from environment or use localhost default
const getApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    // Ensure it doesn't have trailing slash
    return envUrl.replace(/\/$/, '');
  }
  
  // Default to localhost for development
  return 'http://localhost:5000/api';
};

const api = axios.create({
  baseURL: getApiUrl(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    // Ensure withCredentials is always true for all requests
    config.withCredentials = true;
    
    // If data is FormData, remove the default Content-Type header
    // so the browser can set it with the proper boundary for multipart/form-data
    if (config.data instanceof FormData) {
      // Delete the Content-Type header to let the browser set it automatically
      delete config.headers['Content-Type'];
      console.log('FormData detected - removed Content-Type header to allow browser to set multipart/form-data');
    }
    
    // Note: We rely on httpOnly cookies for security
    // Cookies are automatically sent with requests when withCredentials: true
    // We don't use localStorage/sessionStorage for tokens (security risk)
    // If cookies aren't working, check CORS and cookie settings
    
    console.log('API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      withCredentials: config.withCredentials,
      isFormData: config.data instanceof FormData,
      contentType: config.headers['Content-Type'],
      // Cookies should be sent automatically with withCredentials: true
      // Note: httpOnly cookies won't appear in document.cookie
    });
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log error details for debugging
    console.error('API Error:', {
      message: error.message,
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      baseURL: error.config?.baseURL
    });

    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      const isAuthRoute =
        currentPath.startsWith('/login') ||
        currentPath.startsWith('/register') ||
        currentPath.startsWith('/admin/login');
      
      const isGetMeCall = error.config?.url === '/auth/me';

      // Only redirect if not already on auth route and not a getMe call
      if (!isAuthRoute && !isGetMeCall) {
        // Clear Redux auth state via custom event
        window.dispatchEvent(new CustomEvent('auth-failed'));
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;