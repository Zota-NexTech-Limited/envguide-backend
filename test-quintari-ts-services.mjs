// test-quintari-ts-services.mjs — smoke test the COMPILED TypeScript services end-to-end.
// Proves the production code path (src/services/*) works, not just the .mjs scripts.
//
// RUN ORDER:
//   1. npm run build-main         (compiles TS to dist/)
//   2. node test-quintari-ts-services.mjs
//
// What it does:
//   - createProductTwin()  → produces a real twin (with PartTypeInformation) in Quintari
//   - addPcfSubmodel()     → pushes a v9 PCF submodel onto that twin
import "dotenv/config";
import { existsSync } from "node:fs";

const distPath = "./dist/services/quintariDigitalTwinService.js";
if (!existsSync(distPath)) {
    console.error("❌ Compiled output not found at", distPath);
    console.error("Run `npm run build-main` first to compile TypeScript.");
    process.exit(1);
}

const { createProductTwin } = await import("./dist/services/quintariDigitalTwinService.js");
const { addPcfSubmodel } = await import("./dist/services/quintariSubmodelService.js");

const ownBpn = process.env.QUINTARI_OWN_BPN || "BPNL000000000001";
const partId = `ENV-TS-${Date.now()}`;
const productName = `Enviraan TS Test Product (${partId})`;

console.log("=== STEP A: createProductTwin() ===");
const twin = await createProductTwin({
    manufacturerId: ownBpn,
    manufacturerPartId: partId,
    nameAtManufacturer: productName,
    productDescription: "Smoke-test product via compiled TS services",
}).catch((err) => {
    console.error("❌ createProductTwin failed.");
    if (err.response) {
        console.error("   status :", err.response.status);
        console.error("   body   :", JSON.stringify(err.response.data, null, 2));
    } else console.error("   error  :", err.message);
    process.exit(1);
});

console.log("✅ Twin created   :", twin.digitalTwinId);
console.log("   PartTypeInfo  :", twin.submodelIds[0]?.submodelId);

console.log("\n=== STEP B: addPcfSubmodel() ===");
const sub = await addPcfSubmodel(twin.digitalTwinId, {
    productCode: partId,
    productName,
    productMassKg: 0.456,
    companyName: "Enviguide Techno Solutions Pvt Ltd",
    companyBpn: ownBpn,
    totalPcfValue: 2.9,
    materialValue: 2.0,
    productionValue: 0.5,
    packagingValue: 0.2,
    logisticValue: 0.15,
    wasteValue: 0.05,
    geographyCountry: "IN",
    geographyCountrySubdivision: "IN-TG",
    referencePeriodStart: "2024-01-01T00:00:00Z",
    referencePeriodEnd: "2024-12-31T23:59:59Z",
    pcfScope: "Cradle-to-gate",
    primaryDataShare: 56.12,
    technologicalDQR: 2,
    geographicalDQR: 2,
    temporalDQR: 2,
    comment: "Smoke test via compiled TS service",
}).catch((err) => {
    console.error("❌ addPcfSubmodel failed.");
    if (err.response) {
        console.error("   status :", err.response.status);
        console.error("   body   :", JSON.stringify(err.response.data, null, 2));
    } else console.error("   error  :", err.message);
    console.error("\nNote: Twin was already created:", twin.digitalTwinId);
    process.exit(1);
});

console.log("✅ PCF submodel  :", sub.submodelId);
console.log("\n🎉 TS PRODUCTION SERVICES WORK END-TO-END");
console.log("   digitalTwinId :", twin.digitalTwinId);
console.log("   pcfSubmodelId :", sub.submodelId);
console.log("   semanticId    :", sub.semanticId);
console.log("\n   Open Quintari → Digital Twins → find this twin → should show 2 submodels.");
