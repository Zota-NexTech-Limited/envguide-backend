// azureToken.ts
import axios from "axios";
import qs from "qs";

interface AzureTokenResponse {
    access_token: string;
    expires_in: number;
    token_type: string;
}

export async function getGraphAccessToken(): Promise<string> {
    // Read env inside the function so they are set after dotenv.config() runs (avoids load-order issue)
    const clientId = process.env.AZURE_CLIENT_ID || process.env.CLIENT_ID || 'e4e12278-bb7d-46a8-ab06-6496f48ef87c';
    const tenantId = process.env.AZURE_TENANT_ID || process.env.TENANT_ID || '5c9667bd-9d48-4e37-98cb-612dcdab8de2';
    const clientSecret = process.env.AZURE_CLIENT_SECRET || process.env.CLIENT_SECRET || '';

    if (!clientSecret) {
        throw new Error('Azure client secret missing: set AZURE_CLIENT_SECRET or CLIENT_SECRET in .env');
    }

    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

    const data = qs.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        scope: "https://graph.microsoft.com/.default",
        grant_type: "client_credentials"
    });

    const response = await axios.post<AzureTokenResponse>(tokenUrl, data, {
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        }
    });

    return response.data.access_token;
}
