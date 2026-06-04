// test-quintari-publish-real.mjs — pick a REAL bom_pcf_request row and publish to Quintari.
//
// RUN ORDER:
//   1. npm run build-main
//   2. node test-quintari-publish-real.mjs
//
// Optional: pin a specific request:
//   $env:PUBLISH_REQUEST_ID = "<bom_pcf_request.id>"
//   node test-quintari-publish-real.mjs
import "dotenv/config";
import { existsSync } from "node:fs";

const distPath = "./dist/services/quintariPublishService.js";
if (!existsSync(distPath)) {
    console.error("❌ Compiled output not found. Run `npm run build-main` first.");
    process.exit(1);
}

const { listEligiblePcfRequests } = await import(
    "./dist/repositories/pcfRequestRepository.js"
);
const { publishPcfRequestToQuintari } = await import(
    "./dist/services/quintariPublishService.js"
);

console.log("=== Eligible PCF Requests (overall_pcf > 0) ===\n");
const candidates = await listEligiblePcfRequests(5);
if (candidates.length === 0) {
    console.log("(no rows found with overall_pcf > 0 — DB has no completed PCFs yet)");
    process.exit(0);
}

for (const c of candidates) {
    const idShort = String(c.id).slice(0, 8);
    console.log(
        `  • ${String(c.code).padEnd(10)} | id=${idShort}... | product_code=${c.productCode ?? "—"} | ${c.productName ?? "—"} | overall_pcf=${c.overallPcf} | status=${c.status}`
    );
}

const targetId = process.env.PUBLISH_REQUEST_ID || candidates[0].id;
console.log(`\n=== Publishing bom_pcf_request id=${targetId} to Quintari ===\n`);

try {
    const result = await publishPcfRequestToQuintari(targetId);
    console.log("🎉 PUBLISHED");
    console.log("   bom_pcf_request   :", result.bomPcfRequestId);
    console.log("   digitalTwinId     :", result.digitalTwinId);
    console.log("   PartTypeInfo SubM :", result.partTypeInformationSubmodelId);
    console.log("   PCF SubM          :", result.pcfSubmodelId);
    console.log("\nOpen Quintari → Digital Twins → find this twin → should show 2 submodels.");
} catch (err) {
    console.error("❌ Publish failed.");
    if (err.response) {
        console.error("   status :", err.response.status);
        console.error("   body   :", JSON.stringify(err.response.data, null, 2));
    } else {
        console.error("   error  :", err.message);
        if (err.stack) console.error(err.stack);
    }
    process.exit(1);
}

// pg pool keeps the event loop alive; force exit so the script doesn't hang.
process.exit(0);
