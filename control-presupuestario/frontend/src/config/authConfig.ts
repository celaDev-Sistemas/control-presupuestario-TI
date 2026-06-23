import {
  Configuration,
  PopupRequest,
  SilentRequest,
  InteractionRequiredAuthError,
  PublicClientApplication,
} from '@azure/msal-browser';

const tenantId = import.meta.env.VITE_AZURE_TENANT_ID;
const clientId = import.meta.env.VITE_AZURE_CLIENT_ID;
const redirectUri = import.meta.env.VITE_REDIRECT_URI;
const apiScope = `api://${clientId}/access_as_user`;

export const msalConfig: Configuration = {
  auth: {
    clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    redirectUri,
    postLogoutRedirectUri: `${redirectUri}/login`,
    navigateToLoginRequestUrl: false,
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false,
  },
};

export const loginRequest: PopupRequest = {
  scopes: ['openid', 'profile', 'email', apiScope],
};

export const tokenRequest: SilentRequest = {
  scopes: [apiScope],
  forceRefresh: false,
};

export const apiConfig = {
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1',
  timeout: 30000,
};

export const getAccessToken = async (
  instance: PublicClientApplication
): Promise<string | null> => {
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
    if (error instanceof InteractionRequiredAuthError) {
      const response = await instance.acquireTokenPopup({
        scopes: [apiScope],
        account: accounts[0],
      });

      return response.accessToken;
    }

    console.error('Error obteniendo access token:', error);
    return null;
  }
};
