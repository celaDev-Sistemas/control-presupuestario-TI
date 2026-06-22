import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { PublicClientApplication } from '@azure/msal-browser';
import { getAccessToken, apiConfig } from '../config/authConfig';

// ============================================
// TIPOS
// ============================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
}

export interface ApiError {
  success: false;
  error: string;
  code?: string;
  details?: any;
  timestamp: string;
}

// ============================================
// CONFIGURACIÓN DE AXIOS
// ============================================

let msalInstance: PublicClientApplication | null = null;

export function setMsalInstance(instance: PublicClientApplication) {
  msalInstance = instance;
}

// Crear instancia de axios
const api: AxiosInstance = axios.create({
  baseURL: apiConfig.baseUrl,
  timeout: apiConfig.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================
// INTERCEPTORES
// ============================================

// Request interceptor: Agregar token de autenticación
api.interceptors.request.use(
  async (config) => {
    if (msalInstance) {
      const token = await getAccessToken(msalInstance);
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Manejo de errores
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError<ApiError>) => {
    // Manejo de errores específicos
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Token expirado o inválido
          console.error('No autenticado - redirigiendo al login');
          
          // Si el código es TOKEN_EXPIRED, intentar refrescar el token
          if (data?.code === 'TOKEN_EXPIRED' && msalInstance) {
            try {
              const accounts = msalInstance.getAllAccounts();
              if (accounts.length > 0) {
                await msalInstance.acquireTokenPopup({
                  scopes: [`api://${import.meta.env.VITE_AZURE_CLIENT_ID}/access_as_user`],
                  account: accounts[0],
                });
                
                // Reintentar la petición original
                return api.request(error.config as AxiosRequestConfig);
              }
            } catch (refreshError) {
              console.error('Error refrescando token:', refreshError);
            }
          }
          
          // Si no se pudo refrescar, hacer logout
          if (msalInstance) {
            await msalInstance.logoutPopup();
          }
          break;
          
        case 403:
          console.error('No tienes permisos para realizar esta acción');
          break;
          
        case 404:
          console.error('Recurso no encontrado');
          break;
          
        case 500:
          console.error('Error interno del servidor');
          break;
          
        default:
          console.error('Error en la petición:', data?.error || 'Error desconocido');
      }
    } else if (error.request) {
      // La petición se hizo pero no hubo respuesta
      console.error('No se recibió respuesta del servidor');
    } else {
      // Error al configurar la petición
      console.error('Error configurando la petición:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// ============================================
// FUNCIONES DE SERVICIO
// ============================================

// GET request
export async function get<T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  const response = await api.get<ApiResponse<T>>(url, config);
  return response.data;
}

// POST request
export async function post<T>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  const response = await api.post<ApiResponse<T>>(url, data, config);
  return response.data;
}

// PUT request
export async function put<T>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  const response = await api.put<ApiResponse<T>>(url, data, config);
  return response.data;
}

// DELETE request
export async function del<T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  const response = await api.delete<ApiResponse<T>>(url, config);
  return response.data;
}

// PATCH request
export async function patch<T>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  const response = await api.patch<ApiResponse<T>>(url, data, config);
  return response.data;
}

export default api;
