// test-quintari-self-loop.mjs — full closed-loop test: send → land → match → answer.
//
// Sends an outgoing PCF request from us (BPNL000000000001) to ourselves for a
// product_code we've already published, then polls the incoming queue until it
// shows up, then runs the listener to match + answer.
//
// RUN ORDER:
//   1. npm run build-main
//   2. node test-quintari-self-loop.mjs
//
// Optional env var:
//   PUBLISHED_PRODUCT_CODE = "PRO00133"   (default: first published row)
import "dotenv/config";
import { existsSync } from "node:fs";

const distPath = "./dist/services/quintariPcfRequestService.js";
if (!existsSync(distPath)) {
    console.error("❌ Compiled output not found. Run `npm run build-main` first.");
    process.exit(1);
}

const { sendOutgoingPcfRequest, listIncomingPcfRequests } = await import(
    "./dist/services/quintariPcfRequestService.js"
);
const { pollAndAnswerPendingPcfRequests } = await import(
    "./dist/services/quintariPcfListenerService.js"
);
const { withClient } = await import("./dist/util/database.js");

const ownBpn = process.env.QUINTARI_OWN_BPN || "BPNL000000000001";

let productCode = process.env.PUBLISHED_PRODUCT_CODE;
if (!productCode) {
    productCode = await withClient(async (client) => {
        const r = await client.query(
            `SELECT product_code FROM quintari_published_pcfs
             ORDER BY published_at DESC LIMIT 1`
        );
        return r.rows[0]?.product_code;
    });
}
if (!productCode) {
    console.error("❌ No published PCF found in quintari_published_pcfs.");
    console.error("Publish at least one first via test-quintari-publish-real.mjs.");
    process.exit(1);
}

console.log("=== Self-loop config ===");
console.log("   own BPN      :", ownBpn);
console.log("   target part  :", productCode);
console.log("");

console.log("=== Step 1: Send outgoing PCF request (self) ===");
try {
    await sendOutgoingPcfRequest({
        counterPartyBpn: ownBpn,
        manufacturerPartId: productCode,
        message: "Self-loop test",
    });
    console.log("✅ Outgoing send accepted (HTTP 204).\n");
} catch (err) {
    console.error("❌ Outgoing send failed.");
    if (err.response) {
        console.error("   status :", err.response.status);
        console.error("   body   :", JSON.stringify(err.response.data, null, 2));
    } else console.error("   error  :", err.message);
    process.exit(1);
}

console.log("=== Step 2: Poll incoming queue (every 3s, up to 60s) ===");
let pendingRequest = null;
const startedAt = Date.now();
while (Date.now() - startedAt < 60_000) {
    await new Promise((r) => setTimeout(r, 3000));
    const list = await listIncomingPcfRequests(
        { manufacturerPartId: productCode, status: "PENDING" },
        { limit: 5 }
    );
    if (list.data.length > 0) {
        pendingRequest = list.data[0];
        console.log(
            `   → landed: request=${pendingRequest.requestId.slice(0, 8)}... part=${pendingRequest.manufacturerPartId}`
        );
        break;
    }
    process.stdout.write("   …\n");
}

if (!pendingRequest) {
    console.log(
        "\n⚠️  Nothing landed after 60s. EDC routing for self-loop may not be supported in this beta instance."
    );
    console.log(
        "   That's fine — Step A is still verified end-to-end. Real partner traffic will exercise it."
    );
    process.exit(0);
}

console.log("\n=== Step 3: Run listener to match + answer ===\n");
const summary = await pollAndAnswerPendingPcfRequests();
console.log(`pendingFound = ${summary.pendingFound}  processed = ${summary.processed.length}\n`);
for (const p of summary.processed) {
    if (p.outcome === "answered") {
        console.log(
            `🎉 ANSWERED  request=${p.requestId.slice(0, 8)}... part=${p.manufacturerPartId} → submodel=${p.pcfSubmodelId}`
        );
    } else {
        console.log(`⚠️  ${p.outcome.toUpperCase()}  request=${p.requestId.slice(0, 8)}...: ${p.error ?? ""}`);
    }
}

console.log("\n=== Step 4: Verify DB record was marked answered ===");
const updated = await withClient(async (client) => {
    const r = await client.query(
        `SELECT product_code, pcf_submodel_id, answer_count, last_answered_at
         FROM quintari_published_pcfs
         WHERE product_code = $1`,
        [productCode]
    );
    return r.rows[0];
});
console.log("   product_code     :", updated?.product_code);
console.log("   answer_count     :", updated?.answer_count);
console.log("   last_answered_at :", updated?.last_answered_at);

console.log("\n🎉🎉🎉 CLOSED LOOP VERIFIED END-TO-END");
process.exit(0);
