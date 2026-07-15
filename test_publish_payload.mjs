// READ-ONLY: builds the ACTUAL Quintari publish payload for a request using the
// compiled backend code (with the fix) and prints the carbonContent section.
// Does NOT publish to Quintari. Run: node test_publish_payload.mjs <requestId>
import * as dotenv from "dotenv";
dotenv.config();
const { buildEnviraanPcfInputFromRequest } = await import("./dist/repositories/pcfRequestRepository.js");
const { aggregateComputedDetail } = await import("./dist/services/pcfSubmodelService.js");
const { buildPcfV9Payload } = await import("./dist/util/buildPcfV9Payload.js");

const reqId = process.argv[2] || "01KXGC2GJ5EVE2R0F7TEN7BTV4"; // brake pedal
const input = await buildEnviraanPcfInputFromRequest(reqId);

// same enrichment the publish service now does
const detail = await aggregateComputedDetail(reqId);
if (detail) input.carbonContentDetail = detail.carbonContentDetail;

const payload = buildPcfV9Payload(input);
console.log("=== carbonContent block that WOULD be published now ===");
console.log(JSON.stringify(payload.carbonContent, null, 2));
process.exit(0);
