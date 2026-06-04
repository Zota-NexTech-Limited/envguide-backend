// test-quintari-discover-access-groups.mjs — probe Quintari to find the Access Group endpoint.
// Tries several likely paths + OpenAPI discovery. Run: node test-quintari-discover-access-groups.mjs
import "dotenv/config";
import axios from "axios";
import qs from "qs";

const base = process.env.QUINTARI_API_BASE_URL;
const tokenUrl =
    process.env.QUINTARI_TOKEN_URL ||
    "https://keycloak.prod-sovity.azure.sovity.io/realms/Portal/protocol/openid-connect/token";

if (!base) {
    console.error("❌ QUINTARI_API_BASE_URL missing in .env");
    process.exit(1);
}

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
console.log("✓ Got token. Probing endpoints...\n");

const probes = [
    // OpenAPI / Swagger discovery (jackpot if any of these work)
    { method: "GET", path: "/v3/api-docs" },
    { method: "GET", path: "/swagger.json" },
    { method: "GET", path: "/api-docs" },
    { method: "GET", path: "/openapi.json" },
    { method: "GET", path: "/api/openapi.json" },
    // Likely access group endpoints (LIST)
    { method: "GET", path: "/api/core/access-groups" },
    { method: "GET", path: "/api/common/access-groups" },
    { method: "GET", path: "/api/access-groups" },
    { method: "POST", path: "/api/core/access-groups/list", body: {} },
    { method: "POST", path: "/api/common/access-groups/list", body: {} },
    // Some sovity products use /policies as the term
    { method: "GET", path: "/api/core/policies" },
    { method: "GET", path: "/api/common/policies" },
];

for (const p of probes) {
    try {
        const res = await axios.request({
            method: p.method,
            url: `${base}${p.path}`,
            data: p.body,
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
                ...(p.body !== undefined ? { "Content-Type": "application/json" } : {}),
            },
            validateStatus: () => true,
            timeout: 10000,
        });

        const label = `${p.method.padEnd(4)} ${p.path}`;
        if (res.status >= 200 && res.status < 300) {
            console.log(`✅ ${label} -> ${res.status}`);
            const preview =
                typeof res.data === "string"
                    ? res.data.slice(0, 800)
                    : JSON.stringify(res.data, null, 2).slice(0, 1500);
            console.log("   preview:", preview);
            console.log("");
        } else if (res.status === 401 || res.status === 403) {
            console.log(`🔒 ${label} -> ${res.status} (endpoint exists, auth/permission issue)`);
        } else if (res.status === 400) {
            console.log(`⚠️  ${label} -> 400 (endpoint exists, body shape wrong)`);
            const msg =
                typeof res.data === "object" ? JSON.stringify(res.data) : String(res.data).slice(0, 300);
            console.log("   detail:", msg);
        } else if (res.status === 404) {
            console.log(`❌ ${label} -> 404 (not found)`);
        } else if (res.status === 405) {
            console.log(`🔁 ${label} -> 405 (endpoint exists, wrong HTTP method)`);
        } else {
            console.log(`?  ${label} -> ${res.status}`);
        }
    } catch (e) {
        console.log(`💥 ${p.method} ${p.path} -> ERROR: ${e.message}`);
    }
}

console.log("\nNote: 200/400/401/403/405 all mean the endpoint EXISTS. Only 404 means truly not there.");
