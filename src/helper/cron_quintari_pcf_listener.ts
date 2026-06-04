import cron from "node-cron";
import { pollAndAnswerPendingPcfRequests } from "../services/quintariPcfListenerService.js";

const DEFAULT_SCHEDULE = "*/5 * * * *";

let running = false;

async function tick() {
    if (running) return;
    running = true;
    try {
        const summary = await pollAndAnswerPendingPcfRequests();
        if (summary.pendingFound === 0) return;
        console.log(
            `[quintari-pcf-listener] pending=${summary.pendingFound} processed=${summary.processed.length}`
        );
        for (const p of summary.processed) {
            if (p.outcome === "answered") {
                console.log(
                    `[quintari-pcf-listener] ✓ answered request=${p.requestId} part=${p.manufacturerPartId} submodel=${p.pcfSubmodelId}`
                );
            } else {
                console.warn(
                    `[quintari-pcf-listener] ✗ ${p.outcome} request=${p.requestId} part=${p.manufacturerPartId}: ${p.error ?? ""}`
                );
            }
        }
    } catch (err) {
        console.error("[quintari-pcf-listener] tick failed:", err);
    } finally {
        running = false;
    }
}

export function startQuintariPcfListenerCron() {
    if (process.env.QUINTARI_LISTENER_ENABLED === "false") {
        console.log("[quintari-pcf-listener] disabled via QUINTARI_LISTENER_ENABLED=false");
        return;
    }
    const schedule = process.env.QUINTARI_LISTENER_CRON || DEFAULT_SCHEDULE;
    cron.schedule(schedule, () => {
        void tick();
    });
    console.log(`[quintari-pcf-listener] scheduled (${schedule})`);
}
