// test-quintari-probe-access-group-deep.mjs — deeper probe: log raw bytes + headers, try Catena-X-style field names.
// Run: node test-quintari-probe-access-group-deep.mjs
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
console.log("✓ Got token.\n");

async function callRaw(method, path, body) {
    return axios.request({
        method,
        url: `${base}${path}`,
        data: body,
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "*/*",
        },
        validateStatus: () => true,
        transformResponse: [(d) => d], // get raw string, no JSON parsing
        timeout: 10000,
    });
}

function logResponse(label, body, res) {
    console.log(`=== ${label} ===`);
    console.log("body sent  :", JSON.stringify(body));
    console.log("status     :", res.status);
    console.log("headers    :", JSON.stringify(res.headers, null, 2));
    console.log("body bytes :", res.data ? res.data.length : 0);
    console.log("body raw   :", res.data || "(empty)");
    console.log("");
}

// Round 1 — Catena-X-style field name guesses
const round1 = [
    { name: "enviraan-test", consumerBpns: [ownBpn] },
    { name: "enviraan-test", bpnList: [ownBpn] },
    { name: "enviraan-test", businessPartnerNumbers: [ownBpn] },
    { name: "enviraan-test", partnerBpns: [ownBpn] },
    { name: "enviraan-test", bpnls: [ownBpn] },
    { groupId: "enviraan-test", bpns: [ownBpn] },
    { id: "enviraan-test", name: "enviraan-test", bpns: [ownBpn] },
];

for (const body of round1) {
    const res = await callRaw("POST", "/api/access-groups", body);
    logResponse("POST /api/access-groups", body, res);
    if (res.status >= 200 && res.status < 300) {
        console.log("🎉 First working body shape — done.\n");
        process.exit(0);
    }
}

// Round 2 — try PUT instead of POST
console.log("--- Trying PUT method ---\n");
const putRes = await callRaw("PUT", "/api/access-groups", { name: "enviraan-test", bpns: [ownBpn] });
logResponse("PUT /api/access-groups", { name: "enviraan-test", bpns: [ownBpn] }, putRes);

// Round 3 — try path-based create (REST convention)
console.log("--- Trying PUT /api/access-groups/{name} ---\n");
const putByName = await callRaw("PUT", "/api/access-groups/enviraan-test", { bpns: [ownBpn] });
logResponse("PUT /api/access-groups/enviraan-test", { bpns: [ownBpn] }, putByName);

// Round 4 — what does GET on the LIST endpoint say with various query params?
console.log("--- GET /api/access-groups (no body, just headers visible) ---\n");
const getRes = await callRaw("GET", "/api/access-groups");
logResponse("GET /api/access-groups", null, getRes);

console.log("Reading tip: look for any non-empty response body or header (e.g. 'x-error-*' or 'www-authenticate') that hints at the schema.");
