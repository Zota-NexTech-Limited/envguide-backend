// azureToken.ts
import axios from "axios";
import qs from "qs";

const SMTP_USER = 'support@enviguide.info';
const CLIENT_ID = 'e4e12278-bb7d-46a8-ab06-6496f48ef87c';
const TENANT_ID = '5c9667bd-9d48-4e37-98cb-612dcdab8de2';
const CLIENTS = 'sMo8Q~-bpgkwHykqrgUKApJ0iH3Wm4yU_O.ONdxl';

interface AzureTokenResponse {
    access_token: string;
    expires_in: number;
    token_type: string;
}

export async function getGraphAccessToken(): Promise<string> {
    const tokenUrl = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;

    const data = qs.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENTS,
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
