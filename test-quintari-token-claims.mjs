// test-quintari-token-claims.mjs — fetch a Quintari token and inspect its JWT claims.
// Looking for BPN (Business Partner Number) and other identity info embedded by Keycloak.
// Run: node test-quintari-token-claims.mjs
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

const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

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

const token = res.data.access_token;
const [, payloadB64] = token.split(".");
const payloadJson = Buffer.from(
    payloadB64.replace(/-/g, "+").replace(/_/g, "/"),
    "base64"
).toString("utf8");
const claims = JSON.parse(payloadJson);

console.log("🔍 Full JWT claims (decoded from access token):\n");
console.log(JSON.stringify(claims, null, 2));

console.log("\n----------------------------------------");
console.log("🎯 Looking specifically for BPN-related info...");
console.log("----------------------------------------");

const claimKeys = Object.keys(claims);
const bpnishKeys = claimKeys.filter((k) => {
    const low = k.toLowerCase();
    return (
        low.includes("bpn") ||
        low.includes("business") ||
        low.includes("partner") ||
        low.includes("organization") ||
        low.includes("org")
    );
});

if (bpnishKeys.length > 0) {
    console.log("\n✅ Found BPN-like claim keys:");
    for (const k of bpnishKeys) {
        console.log(`   ${k} =`, JSON.stringify(claims[k]));
    }
} else {
    console.log("\n(no claim key names contain bpn/business/partner/org)");
}

const allValues = JSON.stringify(claims);
const bpnMatches = allValues.match(/BPNL[A-Za-z0-9]{12}/g);
if (bpnMatches) {
    console.log("\n🎉 Found BPNL-pattern values anywhere in the claims:");
    console.log("   ", [...new Set(bpnMatches)]);
} else {
    console.log("\n(no BPNL...12chars pattern found anywhere in the token)");
}
