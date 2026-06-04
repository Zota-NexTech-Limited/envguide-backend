// quintariToken.ts — fetches & caches an OAuth2 access token from sovity's Keycloak (client credentials flow)
import axios from "axios";
import qs from "qs";

interface QuintariTokenResponse {
    access_token: string;
    expires_in: number;
    token_type: string;
}

const DEFAULT_TOKEN_URL =
    "https://keycloak.prod-sovity.azure.sovity.io/realms/Portal/protocol/openid-connect/token";

// In-memory cache so we don't request a new token on every Quintari API call.
let cachedToken: string | null = null;
let tokenExpiresAt = 0; // epoch ms

export async function getQuintariToken(forceRefresh = false): Promise<string> {
    // Read env inside the function so values are present after dotenv.config() runs (load-order safety).
    const clientId = process.env.QUINTARI_CLIENT_ID;
    const clientSecret = process.env.QUINTARI_CLIENT_SECRET;
    const tokenUrl = process.env.QUINTARI_TOKEN_URL || DEFAULT_TOKEN_URL;

    if (!clientId || !clientSecret) {
        throw new Error(
            "Quintari credentials missing: set QUINTARI_CLIENT_ID and QUINTARI_CLIENT_SECRET in .env (get them from the sovity Hub)."
        );
    }

    // Reuse the cached token while it is still valid (30s safety buffer before expiry).
    const now = Date.now();
    if (!forceRefresh && cachedToken && now < tokenExpiresAt - 30_000) {
        return cachedToken;
    }

    // Keycloak client-credentials flow using HTTP Basic auth: base64("clientId:clientSecret").
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const response = await axios.post<QuintariTokenResponse>(
        tokenUrl,
        qs.stringify({ grant_type: "client_credentials" }),
        {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: `Basic ${basicAuth}`,
            },
        }
    );

    cachedToken = response.data.access_token;
    tokenExpiresAt = now + response.data.expires_in * 1000;
    return cachedToken;
}
