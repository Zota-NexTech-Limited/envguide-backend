// test-quintari-digital-twin.mjs — one-off test: create a mock Digital Twin in Quintari.
// Goal: prove Auth → API base URL → Twin endpoint pipeline works end-to-end.
// Run: node test-quintari-digital-twin.mjs
import "dotenv/config";
import axios from "axios";
import qs from "qs";
import { randomUUID } from "node:crypto";

const cfg = {
    clientId: process.env.QUINTARI_CLIENT_ID,
    clientSecret: process.env.QUINTARI_CLIENT_SECRET,
    tokenUrl:
        process.env.QUINTARI_TOKEN_URL ||
        "https://keycloak.prod-sovity.azure.sovity.io/realms/Portal/protocol/openid-connect/token",
    apiBaseUrl: process.env.QUINTARI_API_BASE_URL,
    ownBpn: process.env.QUINTARI_OWN_BPN || "BPNL000000000001",
    accessGroup: process.env.QUINTARI_DEFAULT_ACCESS_GROUP_ID || "enviraan-default",
};

if (!cfg.clientId || !cfg.clientSecret) {
    console.error("❌ Missing QUINTARI_CLIENT_ID or QUINTARI_CLIENT_SECRET in .env");
    process.exit(1);
}
if (!cfg.apiBaseUrl) {
    console.error("❌ Missing QUINTARI_API_BASE_URL in .env");
    process.exit(1);
}

console.log("→ Quintari base URL :", cfg.apiBaseUrl);
console.log("→ Own BPN           :", cfg.ownBpn);
console.log("→ Access group      :", cfg.accessGroup);
console.log("→ Requesting token...");

const basicAuth = Buffer.from(`${cfg.clientId}:${cfg.clientSecret}`).toString("base64");
const tokenRes = await axios.post(
    cfg.tokenUrl,
    qs.stringify({ grant_type: "client_credentials" }),
    {
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${basicAuth}`,
        },
    }
);
const token = tokenRes.data.access_token;
console.log("✓ Got token (length:", token.length, ")\n");

const partTypeInfoData = {
    catenaXId: randomUUID(),
    partTypeInformation: {
        manufacturerPartId: "ENV-TEST-PART-001",
        nameAtManufacturer: "Enviraan Test Product 001",
        partClassification: [
            {
                classificationStandard: "GIN 20510-21513",
                classificationID: "1004712",
                classificationDescription: "Enviraan integration-test product",
            },
        ],
    },
    partSitesInformationAsPlanned: [
        {
            catenaXsiteId: "BPNS000000000001",
            function: "production",
            functionValidFrom: "2024-01-01T00:00:00.000Z",
            functionValidUntil: "2099-12-31T23:59:59.000Z",
        },
    ],
};

const body = {
    digitalTwinType: "PartType",
    displayName: { languageCode: "en", text: "Enviraan Test Product 001" },
    description: {
        languageCode: "en",
        text: "Mock test product for Enviraan ↔ Quintari integration verification",
    },
    manufacturerId: cfg.ownBpn,
    dtrMetadata: [
        { name: "source", value: "enviraan-integration-test" },
    ],
    authorizedGroups: [cfg.accessGroup],
    submodels: [
        {
            submodelId: randomUUID(),
            displayName: { languageCode: "en", text: "Part Type Information" },
            description: { languageCode: "en", text: "Identity submodel for the test product" },
            semanticId: "urn:samm:io.catenax.part_type_information:1.0.0#PartTypeInformation",
            submodelData: partTypeInfoData,
        },
    ],
};

console.log("→ POST", cfg.apiBaseUrl + "/api/core/digital-twins");
console.log("  Body :", JSON.stringify(body, null, 2));
console.log("");

try {
    const twinRes = await axios.post(
        `${cfg.apiBaseUrl}/api/core/digital-twins`,
        body,
        {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
                Accept: "application/json",
            },
        }
    );

    console.log("✅ SUCCESS — Digital Twin created!");
    console.log("   HTTP status :", twinRes.status);
    console.log("   Response    :", JSON.stringify(twinRes.data, null, 2));

    const twinId = twinRes.data?.digitalTwinId;
    if (twinId) {
        console.log("\n🎉 Quintari assigned digitalTwinId:", twinId);
        console.log("   Save this ID — step 2 will attach a PCF Submodel to it.");
    }
} catch (err) {
    console.error("❌ FAILED to create Digital Twin.");
    if (err.response) {
        console.error("   HTTP status:", err.response.status);
        console.error("   Response   :", JSON.stringify(err.response.data, null, 2));
    } else {
        console.error("   Error      :", err.message);
    }
    console.error("\nCommon causes:");
    console.error("  - BPN format rejected (try a different QUINTARI_OWN_BPN)");
    console.error("  - Service client missing core_digital_twins_create role");
    console.error("  - Wrong QUINTARI_API_BASE_URL");
    process.exit(1);
}
