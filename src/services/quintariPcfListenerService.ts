import {
    findPublicationByProductCode,
    markPublicationAnswered,
} from "../repositories/pcfRequestRepository.js";
import {
    answerPcfRequest,
    listIncomingPcfRequests,
    type IncomingPcfRequest,
} from "./quintariPcfRequestService.js";

export interface RequestProcessingOutcome {
    requestId: string;
    bpn: string;
    manufacturerPartId: string;
    outcome: "answered" | "no_match" | "error";
    pcfSubmodelId?: string;
    error?: string;
}

export interface PollSummary {
    pendingFound: number;
    processed: RequestProcessingOutcome[];
}

export async function pollAndAnswerPendingPcfRequests(): Promise<PollSummary> {
    const list = await listIncomingPcfRequests({ status: "PENDING" }, { limit: 100 });
    const processed: RequestProcessingOutcome[] = [];

    for (const req of list.data) {
        try {
            const outcome = await processIncomingRequest(req);
            processed.push(outcome);
        } catch (err) {
            processed.push({
                requestId: req.requestId,
                bpn: req.counterParty?.bpnl ?? "",
                manufacturerPartId: req.manufacturerPartId,
                outcome: "error",
                error: err instanceof Error ? err.message : String(err),
            });
        }
    }

    return { pendingFound: list.data.length, processed };
}

async function processIncomingRequest(
    req: IncomingPcfRequest
): Promise<RequestProcessingOutcome> {
    const partId = req.manufacturerPartId || req.customerPartId || "";
    const bpn = req.counterParty?.bpnl ?? "";

    if (!partId) {
        return {
            requestId: req.requestId,
            bpn,
            manufacturerPartId: partId,
            outcome: "no_match",
            error: "request has no manufacturerPartId/customerPartId",
        };
    }

    const publication = await findPublicationByProductCode(partId);
    if (!publication) {
        return {
            requestId: req.requestId,
            bpn,
            manufacturerPartId: partId,
            outcome: "no_match",
            error: `no published PCF found for product_code=${partId}`,
        };
    }

    await answerPcfRequest({
        bpn,
        requestId: req.requestId,
        submodelId: publication.pcfSubmodelId,
        message: `Answered by Enviraan for ${partId}`,
    });

    await markPublicationAnswered(publication.pcfSubmodelId);

    return {
        requestId: req.requestId,
        bpn,
        manufacturerPartId: partId,
        outcome: "answered",
        pcfSubmodelId: publication.pcfSubmodelId,
    };
}
