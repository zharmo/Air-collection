import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
    headers: { 'Content-Type': 'application/json' },
});

let isRedirecting = false;

axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        // Only redirect on 401 if we're not already on a public page and not already redirecting
        if (error.response?.status === 401 && 
            !window.location.pathname.includes('/auth/signin') &&
            !window.location.pathname.includes('/auth/signup') &&
            !window.location.pathname.includes('/products') &&
            !window.location.pathname.includes('/categories')) {
            if (!isRedirecting) {
                isRedirecting = true;
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = `/auth/signin?returnUrl=${encodeURIComponent(window.location.pathname)}`;
            }
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;