import { randomUUID } from "node:crypto";
import { quintariRequest } from "../util/quintariClient.js";

export const PART_TYPE_INFORMATION_SEMANTIC_ID =
    "urn:samm:io.catenax.part_type_information:1.0.0#PartTypeInformation";

export type DigitalTwinType = "PartInstance" | "PartType";

export interface LangText {
    languageCode: string;
    text: string;
}

export interface DtrMetadataEntry {
    name: string;
    value: string;
}

export interface SubmodelEntry {
    submodelId?: string;
    displayName?: LangText;
    description?: LangText;
    semanticId: string;
    submodelData: Record<string, unknown>;
}

export interface CreateDigitalTwinInput {
    digitalTwinId?: string;
    digitalTwinType: DigitalTwinType;
    displayName?: LangText;
    description?: LangText;
    manufacturerId: string;
    dtrMetadata?: DtrMetadataEntry[];
    authorizedGroups?: string[];
    submodels?: SubmodelEntry[];
}

export interface CreateDigitalTwinResponse {
    digitalTwinId: string;
    submodelIds: Array<{
        submodelId: string;
        catenaXId: string;
        semanticId: string;
    }>;
}

export interface PartClassificationEntry {
    classificationStandard: string;
    classificationID: string;
    classificationDescription?: string;
}

export interface ProductTwinInput {
    digitalTwinId?: string;
    digitalTwinType?: DigitalTwinType;
    manufacturerId: string;
    manufacturerPartId: string;
    nameAtManufacturer: string;
    productDescription?: string;
    partClassification?: PartClassificationEntry[];
    siteBpn?: string;
    siteFunctionValidFrom?: string;
    siteFunctionValidUntil?: string;
    catenaXId?: string;
    dtrMetadata?: DtrMetadataEntry[];
    authorizedGroups?: string[];
    extraSubmodels?: SubmodelEntry[];
}

export async function createDigitalTwin(
    input: CreateDigitalTwinInput
): Promise<CreateDigitalTwinResponse> {
    const defaultGroup = process.env.QUINTARI_DEFAULT_ACCESS_GROUP_ID;
    const groups =
        input.authorizedGroups && input.authorizedGroups.length > 0
            ? input.authorizedGroups
            : defaultGroup
              ? [defaultGroup]
              : [];

    if (groups.length === 0) {
        throw new Error(
            "createDigitalTwin: at least one access group is required. Set QUINTARI_DEFAULT_ACCESS_GROUP_ID in .env or pass authorizedGroups."
        );
    }

    const body = {
        digitalTwinId: input.digitalTwinId,
        digitalTwinType: input.digitalTwinType,
        displayName: input.displayName,
        description: input.description,
        manufacturerId: input.manufacturerId,
        dtrMetadata: input.dtrMetadata ?? [],
        authorizedGroups: groups,
        submodels: (input.submodels ?? []).map((s) => ({
            submodelId: s.submodelId ?? randomUUID(),
            displayName: s.displayName,
            description: s.description,
            semanticId: s.semanticId,
            submodelData: s.submodelData,
        })),
    };

    const response = await quintariRequest<CreateDigitalTwinResponse>(
        "POST",
        "/api/core/digital-twins",
        body
    );
    return response.data;
}

export async function createProductTwin(
    input: ProductTwinInput
): Promise<CreateDigitalTwinResponse> {
    const siteBpn = input.siteBpn ?? process.env.QUINTARI_DEFAULT_SITE_BPN ?? "BPNS000000000001";

    const partTypeInformationSubmodel: SubmodelEntry = {
        semanticId: PART_TYPE_INFORMATION_SEMANTIC_ID,
        displayName: { languageCode: "en", text: "Part Type Information" },
        description: { languageCode: "en", text: "Identity submodel" },
        submodelData: {
            catenaXId: input.catenaXId ?? randomUUID(),
            partTypeInformation: {
                manufacturerPartId: input.manufacturerPartId,
                nameAtManufacturer: input.nameAtManufacturer,
                partClassification:
                    input.partClassification ?? [
                        {
                            classificationStandard: "GIN 20510-21513",
                            classificationID: "1004712",
                            classificationDescription: "Generic part classification",
                        },
                    ],
            },
            partSitesInformationAsPlanned: [
                {
                    catenaXsiteId: siteBpn,
                    function: "production",
                    functionValidFrom:
                        input.siteFunctionValidFrom ?? "2024-01-01T00:00:00.000Z",
                    functionValidUntil:
                        input.siteFunctionValidUntil ?? "2099-12-31T23:59:59.000Z",
                },
            ],
        },
    };

    return createDigitalTwin({
        digitalTwinId: input.digitalTwinId,
        digitalTwinType: input.digitalTwinType ?? "PartType",
        displayName: { languageCode: "en", text: input.nameAtManufacturer },
        description: {
            languageCode: "en",
            text: input.productDescription ?? input.nameAtManufacturer,
        },
        manufacturerId: input.manufacturerId,
        dtrMetadata: input.dtrMetadata,
        authorizedGroups: input.authorizedGroups,
        submodels: [partTypeInformationSubmodel, ...(input.extraSubmodels ?? [])],
    });
}
