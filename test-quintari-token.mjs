// test-quintari-token.mjs — one-off sanity check that .env credentials return a Keycloak token.
// Run from envguide-backend-clean2:   node test-quintari-token.mjs
// Delete after the integration is wired up.
import "dotenv/config";
import axios from "axios";
import qs from "qs";

const clientId = process.env.QUINTARI_CLIENT_ID;
const clientSecret = process.env.QUINTARI_CLIENT_SECRET;
const tokenUrl =
    process.env.QUINTARI_TOKEN_URL ||
    "https://keycloak.prod-sovity.azure.sovity.io/realms/Portal/protocol/openid-connect/token";

if (!clientId || !clientSecret) {
    console.error("❌ Missing QUINTARI_CLIENT_ID or QUINTARI_CLIENT_SECRET in .env");
    process.exit(1);
}

console.log("→ Token URL :", tokenUrl);
console.log("→ Client ID :", clientId.slice(0, 6) + "..." + " (length: " + clientId.length + ")");
console.log("→ Requesting token...\n");

const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

try {
    const res = await axios.post(
        tokenUrl,
        qs.stringify({ grant_type: "client_credentials" }),
        {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: `Basic ${basicAuth}`,
            },
        }
    );

    const { access_token: token, expires_in: expiresIn, token_type: tokenType } = res.data;

    console.log("✅ SUCCESS — token received!");
    console.log("   token_type :", tokenType);
    console.log("   expires_in :", expiresIn, "seconds (~" + Math.round(expiresIn / 60) + " min)");
    console.log("   token len  :", token.length);
    console.log("   token head :", token.slice(0, 20) + "...");
    console.log("\nThe token-fetching pipeline is working end-to-end. Safe to proceed to step 2.");
} catch (err) {
    console.error("❌ FAILED to get token.");
    if (err.response) {
        console.error("   HTTP status:", err.response.status);
        console.error("   Response   :", JSON.stringify(err.response.data, null, 2));
    } else {
        console.error("   Error      :", err.message);
    }
    console.error("\nCommon causes:");
    console.error("  - Wrong Client Secret (regenerate in Hub if unsure)");
    console.error("  - Wrong Token URL (the one from the Hub overrides our default)");
    console.error("  - Service client has no roles ticked");
    process.exit(1);
}
