import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import { PublicClientApplication } from '@azure/msal-browser';
import { getAccessToken, apiConfig } from '../config/authConfig';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
}

export interface ApiError {
  success?: false;
  error?: string;
  code?: string;
  details?: any;
  timestamp?: string;
}

let msalInstance: PublicClientApplication | null = null;

export function setMsalInstance(instance: PublicClientApplication) {
  msalInstance = instance;
}

const api: AxiosInstance = axios.create({
  baseURL: apiConfig.baseUrl,
  timeout: apiConfig.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    if (!msalInstance) return config;

    const token = await getAccessToken(msalInstance);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    if (error.response) {
      const { status, data, config } = error.response;

      if (status === 401) {
        console.error('API 401:', data?.error || 'No autorizado');

        // Importante:
        // NO hacer logout automático aquí.
        // Un 401 de un endpoint no debe destruir la sesión MSAL.
      }

      if (status === 403) {
        console.error('API 403:', data?.error || 'Sin permisos');
      }

      if (status === 404) {
        console.error('API 404:', config.url);
      }

      if (status >= 500) {
        console.error('API 500:', data?.error || 'Error interno');
      }
    } else if (error.request) {
      console.error('No se recibió respuesta del servidor');
    } else {
      console.error('Error configurando petición:', error.message);
    }

    return Promise.reject(error);
  }
);

export async function get<T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  const response = await api.get<ApiResponse<T>>(url, config);
  return response.data;
}

export async function post<T>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  const response = await api.post<ApiResponse<T>>(url, data, config);
  return response.data;
}

export async function put<T>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  const response = await api.put<ApiResponse<T>>(url, data, config);
  return response.data;
}

export async function del<T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  const response = await api.delete<ApiResponse<T>>(url, config);
  return response.data;
}

export async function patch<T>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  const response = await api.patch<ApiResponse<T>>(url, data, config);
  return response.data;
}

export default api;
