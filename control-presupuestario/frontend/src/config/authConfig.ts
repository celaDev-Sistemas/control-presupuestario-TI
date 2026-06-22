import { Configuration, PopupRequest } from '@azure/msal-browser';

// ============================================
// CONFIGURACIÓN DE MSAL (Azure AD)
// ============================================

export const msalConfig: Configuration = {
  auth: {
    // Tu Client ID del App Registration que vas a crear
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID || 'YOUR_CLIENT_ID',
    
    // Tu Tenant ID (el que ya usas)
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID || 'deb13623-4618-4c6b-a268-3d5e4dec1c30'}`,
    
    // Redirect URI - ajusta según tu deployment
    redirectUri: import.meta.env.VITE_REDIRECT_URI || 'http://localhost:5173',
    
    // Post logout redirect
    postLogoutRedirectUri: import.meta.env.VITE_REDIRECT_URI || 'http://localhost:5173',
  },
  cache: {
    cacheLocation: 'localStorage', // Opciones: 'localStorage' o 'sessionStorage'
    storeAuthStateInCookie: false, // Cambiar a true si tienes problemas con IE11 o Edge
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        
        switch (level) {
          case 0: // Error
            console.error(message);
            break;
          case 1: // Warning
            console.warn(message);
            break;
          case 2: // Info
            console.info(message);
            break;
          case 3: // Verbose
            console.debug(message);
            break;
        }
      },
    },
  },
};

// ============================================
// SCOPES Y PERMISOS
// ============================================

// Scopes para el login
export const loginRequest: PopupRequest = {
  scopes: [
    // Scope para acceder a tu API
    `api://${import.meta.env.VITE_AZURE_CLIENT_ID || 'YOUR_CLIENT_ID'}/access_as_user`,
  ],
};

// Scopes para obtener access token
export const tokenRequest = {
  scopes: [
    `api://${import.meta.env.VITE_AZURE_CLIENT_ID || 'YOUR_CLIENT_ID'}/access_as_user`,
  ],
  forceRefresh: false, // Cambiar a true para forzar refresh
};

// ============================================
// CONFIGURACIÓN DE LA API
// ============================================

export const apiConfig = {
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1',
  timeout: 30000, // 30 segundos
};

// ============================================
// HELPER: Verificar si el usuario está autenticado
// ============================================

export const isAuthenticated = (instance: any): boolean => {
  const accounts = instance.getAllAccounts();
  return accounts.length > 0;
};

// ============================================
// HELPER: Obtener el access token
// ============================================

export const getAccessToken = async (instance: any): Promise<string | null> => {
  const accounts = instance.getAllAccounts();
  
  if (accounts.length === 0) {
    return null;
  }
  
  try {
    const response = await instance.acquireTokenSilent({
      ...tokenRequest,
      account: accounts[0],
    });
    
    return response.accessToken;
  } catch (error) {
    console.error('Error obteniendo access token:', error);
    
    // Si falla el silent token, intentar con popup
    try {
      const response = await instance.acquireTokenPopup(tokenRequest);
      return response.accessToken;
    } catch (popupError) {
      console.error('Error obteniendo token con popup:', popupError);
      return null;
    }
  }
};
