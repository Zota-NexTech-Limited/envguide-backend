// test-quintari-pcf-submodel.mjs — end-to-end test: create twin + push PCF v9 submodel.
// Proves the FULL data delivery pipeline (auth → twin → PCF data) against real Quintari.
// Run: node test-quintari-pcf-submodel.mjs
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

if (!cfg.clientId || !cfg.clientSecret || !cfg.apiBaseUrl) {
    console.error("❌ Missing required env vars (CLIENT_ID/SECRET/API_BASE_URL).");
    process.exit(1);
}

console.log("→ Quintari base URL :", cfg.apiBaseUrl);
console.log("→ Own BPN           :", cfg.ownBpn);
console.log("→ Access group      :", cfg.accessGroup);

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
console.log("✓ Got token\n");

const authHeaders = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
};

// =============================================================================
// STEP A — Create a fresh Digital Twin (with required PartTypeInformation submodel)
// =============================================================================
const partTypeInfoData = {
    catenaXId: randomUUID(),
    partTypeInformation: {
        manufacturerPartId: "ENV-TEST-PART-002",
        nameAtManufacturer: "Enviraan Test Product 002",
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

const twinBody = {
    digitalTwinType: "PartType",
    displayName: { languageCode: "en", text: "Enviraan Test Product 002" },
    description: { languageCode: "en", text: "End-to-end PCF v9 submodel test" },
    manufacturerId: cfg.ownBpn,
    dtrMetadata: [{ name: "source", value: "enviraan-integration-test" }],
    authorizedGroups: [cfg.accessGroup],
    submodels: [
        {
            submodelId: randomUUID(),
            displayName: { languageCode: "en", text: "Part Type Information" },
            description: { languageCode: "en", text: "Identity submodel" },
            semanticId: "urn:samm:io.catenax.part_type_information:1.0.0#PartTypeInformation",
            submodelData: partTypeInfoData,
        },
    ],
};

console.log("=== STEP A: Create Digital Twin ===");
console.log("→ POST", cfg.apiBaseUrl + "/api/core/digital-twins");

let twinRes;
try {
    twinRes = await axios.post(`${cfg.apiBaseUrl}/api/core/digital-twins`, twinBody, {
        headers: authHeaders,
    });
} catch (err) {
    console.error("❌ Twin creation FAILED.");
    if (err.response) {
        console.error("   status :", err.response.status);
        console.error("   body   :", JSON.stringify(err.response.data, null, 2));
    } else console.error("   error  :", err.message);
    process.exit(1);
}

const digitalTwinId = twinRes.data.digitalTwinId;
console.log("✅ Twin created. digitalTwinId =", digitalTwinId, "\n");

// =============================================================================
// STEP B — Build and push the PCF v9 submodel
// =============================================================================
const pcfSubmodelId = randomUUID();
const pcfDataPayload = {
    general: [{ comment: "Mock PCF data for Enviraan ↔ Quintari integration verification" }],
    carbonContent: [
        {
            biogenicCarbonContent: 0,
            packagingBiogenicCarbonContent: 0,
            recycledCarbonContent: 0,
            carbonContentTotal: 0.52,
            fossilCarbonContent: 0.1,
        },
    ],
    attestationOfConformance: [
        {
            attestationOfConformanceLink: "https://example.com/cert/enviraan-test",
            standardName: "Catena-X Product Carbon Footprint Rulebook v4",
            completedAt: "2025-12-31T23:59:59Z",
            attestationOfConformanceId: randomUUID(),
            providerId: `urn:cofinity-x.com:bpn:${cfg.ownBpn}`,
            attestationType: "PCF Program Certification",
            attestationStandard:
                "PCF Verification and PCF Program Certification Framework V2",
            providerName: "Test Verifier",
        },
    ],
    productLifeCycleStagesAndEmissions: [
        {
            productionStage: [
                {
                    biogenicNonCO2Emissions: 0,
                    landUseChangeGhgEmissions: 0,
                    landManagementBiogenicCO2Removals: 0,
                    aircraftGhgEmissions: 0,
                    landManagementBiogenicCO2Emissions: 0,
                    packagingLandManagementBiogenicCO2Emissions: 0,
                    pcfExcludingBiogenicUptake: 2.5,
                    fossilGhgEmissions: 2.5,
                    biogenicCO2Uptake: 0,
                    pcfIncludingBiogenicUptake: 2.5,
                },
            ],
            packagingStage: [
                {
                    packagingEmissionsIncluded: true,
                    packagingPcfIncludingBiogenicUptake: 0.2,
                    packagingBiogenicNonCO2Emissions: 0,
                    packagingLandManagementBiogenicCO2Emissions: 0,
                    packagingFossilGhgEmissions: 0.2,
                    packagingPcfExcludingBiogenicUptake: 0.2,
                    packagingBiogenicCO2Uptake: 0,
                    packagingLandUseChangeGhgEmissions: 0,
                    packagingAircraftGhgEmissions: 0,
                    packagingLandManagementBiogenicCO2Removals: 0,
                },
            ],
            distributionStage: [
                {
                    distributionStageIncluded: false,
                    distributionStagePcfIncludingBiogenicUptake: 0,
                    distributionStagePcfExcludingBiogenicUptake: 0,
                    distributionStageFossilGhgEmissions: 0,
                    distributionStageAircraftGhgEmissions: 0,
                    distributionStageLandUseChangeGhgEmissions: 0,
                    distributionStageLandManagementBiogenicCO2Emissions: 0,
                    distributionStageLandManagementBiogenicCO2Removals: 0,
                    distributionStageBiogenicCO2Uptake: 0,
                    distributionStageBiogenicNonCO2Emissions: 0,
                },
            ],
        },
    ],
    pcfAssessmentAndMethodology: [
        {
            dataSourcesAndQuality: [
                {
                    secondaryEmissionFactorSources: ["ecoinvent 3.8"],
                    primaryDataShare: 56.12,
                    technologicalDQR: 2,
                    geographicalDQR: 2,
                    temporalDQR: 2,
                },
            ],
            pcfMethodology: [
                {
                    standards: [
                        {
                            crossSectoralStandards: ["ISO 14067"],
                            productOrSectorSpecificRules: [
                                "urn:tfs-initiative.com:PCR:Generic:version:v1.0",
                            ],
                        },
                    ],
                    gwpCharacterizationFactorDetails: [{ ipccCharacterizationFactors: "AR5" }],
                    massBalancingInformation: [
                        {
                            massBalancingCertificateScheme: "ISCC+",
                            massBalancingUsed: false,
                            freeAttributionInMassBalancing: "false",
                        },
                    ],
                    allocationInForeground: [
                        {
                            allocationRulesDescription: "In accordance with Catena-X PCF Rulebook",
                            allocationRecycledCarbon: "upstream system expansion",
                            allocationWasteIncineration: "cut-off",
                        },
                    ],
                },
            ],
            pcfAssessmentInformation: [
                {
                    technology: [
                        {
                            ccsTechnologicalCO2CaptureIncluded: false,
                            boundaryProcessesDescription:
                                "Electricity consumption included as an input",
                        },
                    ],
                    boundarySpecifications: [
                        { exemptedEmissionsPercent: 0, exemptedEmissionsDescription: "No exemption" },
                    ],
                    time: [
                        {
                            referencePeriodStart: "2024-01-01T00:00:00Z",
                            referencePeriodEnd: "2024-12-31T23:59:59Z",
                            validityPeriodStart: "2025-01-01T00:00:00Z",
                            validityPeriodEnd: "2025-12-31T23:59:59Z",
                            created: "2025-12-01T00:00:00Z",
                        },
                    ],
                    geography: [
                        {
                            geographyCountry: "IN",
                            geographyCountrySubdivision: "IN-TG",
                            geographyRegionOrSubregion: "Asia",
                        },
                    ],
                    idAndVersion: [
                        {
                            id: randomUUID(),
                            version: 1,
                            status: "Active",
                            retroOrProspectivePcfType: "Retrospective PCF",
                            precedingPfIds: [],
                        },
                    ],
                },
            ],
            verificationAndCertificationShares: [
                {
                    programCertificationShare: 0,
                    productVerificationShare1stParty: 100,
                    productVerificationShare2ndParty: 0,
                    productVerificationShare3rdParty: 0,
                },
            ],
        },
    ],
    scopeOfPcfForm: [
        {
            partialFullPcf: "Cradle-to-gate",
            specVersion: "urn:io.catenax.pcf:datamodel:version:9.0.0",
        },
    ],
    companyAndProductInformation: [
        {
            productInformation: [
                {
                    productNameCompany: "Enviraan Test Product 002",
                    productDescription:
                        "Mock test product for Enviraan ↔ Quintari PCF v9 integration",
                    declaredUnitOfMeasurement: "piece",
                    declaredUnitAmount: 1.0,
                    productMassPerDeclaredUnit: 0.456,
                    productIds: ["urn:enviguide.com:product-id:ENV-TEST-PART-002"],
                    productClassifications: ["urn:gtin:00000000000000"],
                },
            ],
            companyInformation: [
                {
                    companyName: "Enviguide Techno Solutions Pvt Ltd",
                    companyIds: [`urn:${cfg.ownBpn}`],
                },
            ],
        },
    ],
};

const submodelBody = {
    digitalTwinId,
    submodels: [
        {
            submodelId: pcfSubmodelId,
            displayName: { languageCode: "en", text: "PCF v9 Data" },
            description: { languageCode: "en", text: "Product Carbon Footprint per Catena-X v9" },
            semanticId: "urn:samm:io.catenax.pcf:9.0.0#Pcf",
            submodelData: pcfDataPayload,
        },
    ],
};

console.log("=== STEP B: Attach PCF v9 Submodel ===");
console.log("→ POST", cfg.apiBaseUrl + "/api/core/submodels");
console.log("  semanticId :", submodelBody.submodels[0].semanticId);
console.log("  pcf sections:", Object.keys(pcfDataPayload).join(", "));

try {
    const subRes = await axios.post(`${cfg.apiBaseUrl}/api/core/submodels`, submodelBody, {
        headers: authHeaders,
    });
    console.log("\n✅ PCF Submodel attached!");
    console.log("   HTTP status :", subRes.status);
    console.log("   Response    :", JSON.stringify(subRes.data, null, 2));
    console.log("\n🎉🎉🎉 END-TO-END PIPELINE WORKS:");
    console.log("   digitalTwinId :", digitalTwinId);
    console.log("   pcfSubmodelId :", pcfSubmodelId);
    console.log("   Open Quintari → Digital Twins → find this twin → it should show 2 submodels.");
} catch (err) {
    console.error("\n❌ PCF Submodel attachment FAILED.");
    if (err.response) {
        console.error("   status :", err.response.status);
        console.error("   body   :", JSON.stringify(err.response.data, null, 2));
    } else console.error("   error  :", err.message);
    console.error("\nNote: Twin was already created (digitalTwinId =", digitalTwinId, ").");
    console.error("You can attach the submodel separately or delete this twin from the UI.");
    process.exit(1);
}
