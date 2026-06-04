import { quintariRequest } from "../util/quintariClient.js";

export type PcfRequestStatus = "PENDING" | "ANSWERED" | "IGNORED";

export interface CounterParty {
    bpnl: string;
    legalName: string;
    legalShortName: string;
}

export interface IncomingPcfRequest {
    requestId: string;
    counterParty: CounterParty;
    manufacturerPartId: string;
    customerPartId: string | null;
    message: string | null;
    direction: "INBOUND" | "OUTBOUND";
    apiVersion: string;
    status: PcfRequestStatus;
    createdAt: string;
    updatedAt: string;
    transferStatus: string;
    responseList: Array<{
        messageId: string;
        message: string | null;
        createdAt: string;
        updatedAt: string;
        apiVersion: string;
        transferStatus: string;
        transferError: string | null;
    }>;
}

export interface ListIncomingPcfRequestsFilter {
    requestId?: string;
    bpn?: string;
    manufacturerPartId?: string;
    customerPartId?: string;
    status?: PcfRequestStatus;
    createdBefore?: string;
    createdAfter?: string;
    updatedBefore?: string;
    updatedAfter?: string;
}

export interface ListIncomingPcfRequestsOptions {
    sortBy?: string;
    sortDirection?: "ASC" | "DESC";
    limit?: number;
    cursor?: string;
}

export interface ListIncomingPcfRequestsResponse {
    data: IncomingPcfRequest[];
    cursor: { next: string | null; current: string | null };
}

export async function listIncomingPcfRequests(
    filter: ListIncomingPcfRequestsFilter = {},
    options: ListIncomingPcfRequestsOptions = {}
): Promise<ListIncomingPcfRequestsResponse> {
    const query = new URLSearchParams();
    if (options.sortBy) query.set("sortBy", options.sortBy);
    if (options.sortDirection) query.set("sortDirection", options.sortDirection);
    if (options.limit) query.set("limit", String(options.limit));
    if (options.cursor) query.set("cursor", options.cursor);
    const qs = query.toString();
    const path = `/api/pcf/requests/incoming/list${qs ? `?${qs}` : ""}`;

    const response = await quintariRequest<ListIncomingPcfRequestsResponse>(
        "POST",
        path,
        filter
    );
    return response.data;
}

export async function getIncomingPcfRequest(
    bpn: string,
    requestId: string
): Promise<IncomingPcfRequest> {
    const response = await quintariRequest<IncomingPcfRequest>(
        "GET",
        `/api/pcf/requests/incoming/${encodeURIComponent(bpn)}/${encodeURIComponent(requestId)}`
    );
    return response.data;
}

export interface AnswerPcfRequestInput {
    bpn: string;
    requestId: string;
    submodelId: string;
    message?: string;
    selectedEdcEndpoint?: string;
}

export async function answerPcfRequest(input: AnswerPcfRequestInput): Promise<void> {
    const body: Record<string, string> = { submodelId: input.submodelId };
    if (input.message) body.message = input.message;
    const edc = input.selectedEdcEndpoint ?? process.env.QUINTARI_EDC_ENDPOINT;
    if (edc) body.selectedEdcEndpoint = edc;

    await quintariRequest(
        "POST",
        `/api/pcf/requests/incoming/${encodeURIComponent(input.bpn)}/${encodeURIComponent(input.requestId)}/answer`,
        body
    );
}

export interface SendOutgoingPcfRequestInput {
    counterPartyBpn: string;
    manufacturerPartId: string;
    customerPartId?: string;
    message?: string;
    selectedEdcEndpoint?: string;
}

export async function sendOutgoingPcfRequest(
    input: SendOutgoingPcfRequestInput
): Promise<void> {
    const body: Record<string, string> = {
        manufacturerPartId: input.manufacturerPartId,
    };
    if (input.customerPartId) body.customerPartId = input.customerPartId;
    if (input.message) body.message = input.message;
    const edc = input.selectedEdcEndpoint ?? process.env.QUINTARI_EDC_ENDPOINT;
    if (edc) body.selectedEdcEndpoint = edc;

    await quintariRequest(
        "POST",
        `/api/pcf/requests/outgoing/${encodeURIComponent(input.counterPartyBpn)}/send`,
        body
    );
}
