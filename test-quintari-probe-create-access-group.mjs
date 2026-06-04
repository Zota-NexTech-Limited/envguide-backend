// test-quintari-probe-create-access-group.mjs — discover the POST body shape for /api/access-groups.
// Sends several candidate bodies; validation errors reveal which fields are required.
// Run: node test-quintari-probe-create-access-group.mjs
import "dotenv/config";
import axios from "axios";
import qs from "qs";

const base = process.env.QUINTARI_API_BASE_URL;
const tokenUrl =
    process.env.QUINTARI_TOKEN_URL ||
    "https://keycloak.prod-sovity.azure.sovity.io/realms/Portal/protocol/openid-connect/token";
const ownBpn = process.env.QUINTARI_OWN_BPN || "BPNL000000000001";

const basicAuth = Buffer.from(
    `${process.env.QUINTARI_CLIENT_ID}:${process.env.QUINTARI_CLIENT_SECRET}`
).toString("base64");
const tokenRes = await axios.post(
    tokenUrl,
    qs.stringify({ grant_type: "client_credentials" }),
    {
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${basicAuth}`,
        },
    }
);
const token = tokenRes.data.access_token;
console.log("✓ Got token. Probing POST /api/access-groups with various body shapes...\n");

const candidates = [
    { label: "empty {}",                              body: {} },
    { label: "just name",                             body: { name: "enviraan-default" } },
    { label: "name + description",                    body: { name: "enviraan-default", description: "default access group for enviraan integration tests" } },
    { label: "name + bpns",                           body: { name: "enviraan-default", bpns: [ownBpn] } },
    { label: "name + members",                        body: { name: "enviraan-default", members: [ownBpn] } },
    { label: "name + authorizedBpns",                 body: { name: "enviraan-default", authorizedBpns: [ownBpn] } },
    { label: "groupName variant",                     body: { groupName: "enviraan-default", bpns: [ownBpn] } },
    { label: "full guess",                            body: { name: "enviraan-default", description: "test group", bpns: [ownBpn], authorizedBpns: [ownBpn], members: [ownBpn] } },
];

for (const c of candidates) {
    try {
        const res = await axios.request({
            method: "POST",
            url: `${base}/api/access-groups`,
            data: c.body,
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            validateStatus: () => true,
            timeout: 10000,
        });

        const tag =
            res.status >= 200 && res.status < 300 ? "✅" :
            res.status === 400 ? "⚠️ " :
            res.status === 401 || res.status === 403 ? "🔒" :
            res.status === 405 ? "🔁" :
            res.status === 404 ? "❌" : "? ";

        console.log(`${tag} [${res.status}] ${c.label}`);
        console.log("   body sent:", JSON.stringify(c.body));
        const preview =
            typeof res.data === "string"
                ? res.data.slice(0, 600)
                : JSON.stringify(res.data, null, 2).slice(0, 1200);
        console.log("   response :", preview);
        console.log("");

        if (res.status >= 200 && res.status < 300) {
            console.log("🎉 First successful create — stopping the probe.");
            console.log("\nCanonical body shape that works:", JSON.stringify(c.body, null, 2));
            break;
        }
    } catch (e) {
        console.log(`💥 ${c.label} -> ERROR: ${e.message}\n`);
    }
}

console.log("\nReading tip: 400 responses usually list the missing/invalid field — that tells us the schema.");
