import { randomUUID } from "node:crypto";
import { quintariRequest } from "../util/quintariClient.js";
import {
    buildPcfV9Payload,
    PCF_V9_SEMANTIC_ID,
    type EnviraanPcfInput,
} from "../util/buildPcfV9Payload.js";
import type { LangText } from "./quintariDigitalTwinService.js";

export interface SubmodelCreationResult {
    submodelId: string;
    digitalTwinId: string;
    authorizedGroups: string[];
    semanticId: string;
}

export interface AddSubmodelInput {
    digitalTwinId: string;
    semanticId: string;
    submodelData: Record<string, unknown>;
    submodelId?: string;
    displayName?: LangText;
    description?: LangText;
}

export async function addSubmodel(
    input: AddSubmodelInput
): Promise<SubmodelCreationResult> {
    const body = {
        digitalTwinId: input.digitalTwinId,
        submodels: [
            {
                submodelId: input.submodelId ?? randomUUID(),
                displayName: input.displayName,
                description: input.description,
                semanticId: input.semanticId,
                submodelData: input.submodelData,
            },
        ],
    };

    const response = await quintariRequest<SubmodelCreationResult[]>(
        "POST",
        "/api/core/submodels",
        body
    );

    if (!Array.isArray(response.data) || response.data.length === 0) {
        throw new Error("Quintari returned no submodel in /api/core/submodels response.");
    }
    return response.data[0];
}

export async function addPcfSubmodel(
    digitalTwinId: string,
    input: EnviraanPcfInput
): Promise<SubmodelCreationResult> {
    return addSubmodel({
        digitalTwinId,
        semanticId: PCF_V9_SEMANTIC_ID,
        submodelData: buildPcfV9Payload(input),
        displayName: { languageCode: "en", text: "PCF v9 Data" },
        description: {
            languageCode: "en",
            text: `Product Carbon Footprint for ${input.productName}`,
        },
    });
}

export async function deleteSubmodel(submodelId: string): Promise<void> {
    await quintariRequest("DELETE", `/api/core/submodels/${encodeURIComponent(submodelId)}`);
}

export async function getSubmodel<T = unknown>(
    submodelId: string
): Promise<{
    submodelId: string;
    digitalTwinId: string;
    authorizedGroups: string[];
    semanticId: string;
    submodelData: T;
}> {
    const response = await quintariRequest<{
        submodelId: string;
        digitalTwinId: string;
        authorizedGroups: string[];
        semanticId: string;
        submodelData: T;
    }>("GET", `/api/core/submodels/${encodeURIComponent(submodelId)}`);
    return response.data;
}
