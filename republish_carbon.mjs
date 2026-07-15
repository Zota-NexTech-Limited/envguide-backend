// Re-publishes ONE request's PCF submodel to Quintari (inttest) with the carbon-
// content fix: deletes the stale PCF submodel and adds the corrected one to the
// SAME existing twin. WRITES to Quintari inttest. Run: node republish_carbon.mjs <requestId>
import * as dotenv from "dotenv";
dotenv.config();
const { republishPcfRequestToQuintari } = await import("./dist/services/quintariPublishService.js");

const reqId = process.argv[2] || "01KXGC2GJ5EVE2R0F7TEN7BTV4"; // Brake Pedal
console.log(`Re-publishing request ${reqId} to Quintari (inttest)...\n`);
const result = await republishPcfRequestToQuintari(reqId);
console.log("Result:");
console.log(JSON.stringify(result, null, 2));
process.exit(0);
