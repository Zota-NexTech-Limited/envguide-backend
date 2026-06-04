// test-quintari-listener.mjs — manually invoke one polling tick of the PCF request listener.
//
// RUN ORDER:
//   1. npm run build-main
//   2. node test-quintari-listener.mjs
//
// This bypasses the cron schedule and runs the polling loop ONCE so we can see
// what's in the queue right now and confirm the matching/answer logic works.
import "dotenv/config";
import { existsSync } from "node:fs";

const distPath = "./dist/services/quintariPcfListenerService.js";
if (!existsSync(distPath)) {
    console.error("❌ Compiled output not found. Run `npm run build-main` first.");
    process.exit(1);
}

const { pollAndAnswerPendingPcfRequests } = await import(
    "./dist/services/quintariPcfListenerService.js"
);
const { listIncomingPcfRequests } = await import(
    "./dist/services/quintariPcfRequestService.js"
);

console.log("=== Step 1: List ALL incoming PCF requests (any status) ===");
const everything = await listIncomingPcfRequests({}, { limit: 20 });
if (everything.data.length === 0) {
    console.log("(no incoming requests at all — Quintari queue is empty)");
} else {
    for (const r of everything.data) {
        console.log(
            `  • request=${r.requestId.slice(0, 8)}... status=${r.status} bpn=${r.counterParty?.bpnl ?? "—"} part=${r.manufacturerPartId} ${r.message ? `msg="${r.message}"` : ""}`
        );
    }
}

console.log("\n=== Step 2: Poll PENDING and answer ===\n");
const summary = await pollAndAnswerPendingPcfRequests();
console.log(`pendingFound = ${summary.pendingFound}`);
console.log(`processed    = ${summary.processed.length}\n`);

for (const p of summary.processed) {
    if (p.outcome === "answered") {
        console.log(
            `✅ request=${p.requestId.slice(0, 8)}... part=${p.manufacturerPartId} → submodel=${p.pcfSubmodelId}`
        );
    } else {
        console.log(
            `⚠️  ${p.outcome.toUpperCase()} request=${p.requestId.slice(0, 8)}... part=${p.manufacturerPartId}: ${p.error ?? ""}`
        );
    }
}

if (summary.pendingFound === 0) {
    console.log(
        "\nℹ️  Nothing pending. To test the answer flow, you'd need an outgoing PCF request from another BPN —"
    );
    console.log(
        "   or just wait. The cron will pick up anything that lands in `inttest-pre-01`'s queue."
    );
}

process.exit(0);
