import dotenv from 'dotenv';

dotenv.config();

const tenantId = process.env.AZURE_AD_TENANT_ID;
const clientId = process.env.AZURE_AD_CLIENT_ID;
const audience =
  process.env.AZURE_AD_AUDIENCE || `api://${clientId}`;

if (!tenantId || !clientId) {
  throw new Error('Faltan AZURE_AD_TENANT_ID o AZURE_AD_CLIENT_ID');
}

export const azureAdConfig = {
  tenantId,
  clientId,
  audience,

  validIssuers: [
    `https://login.microsoftonline.com/${tenantId}/v2.0`,
    `https://sts.windows.net/${tenantId}/`,
  ],

  jwksUri: `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`,

  clockTolerance: 300,
};

export function validateAzureAdConfig(): void {
  console.log('✅ Configuración de Azure AD validada');
  console.log(`Tenant: ${tenantId}`);
  console.log(`Client ID: ${clientId}`);
  console.log(`Audience: ${audience}`);
}

export default azureAdConfig;
