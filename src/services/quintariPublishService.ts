import {
    buildEnviraanPcfInputFromRequest,
    findPublicationByBomPcfRequestId,
    recordPublication,
} from "../repositories/pcfRequestRepository.js";
import { createProductTwin } from "./quintariDigitalTwinService.js";
import { addPcfSubmodel } from "./quintariSubmodelService.js";

export interface PublishResult {
    bomPcfRequestId: string;
    digitalTwinId: string;
    partTypeInformationSubmodelId: string;
    pcfSubmodelId: string;
    alreadyPublished: boolean;
}

export interface PublishOptions {
    force?: boolean;
}

export async function publishPcfRequestToQuintari(
    bomPcfRequestId: string,
    options: PublishOptions = {}
): Promise<PublishResult> {
    if (!options.force) {
        const existing = await findPublicationByBomPcfRequestId(bomPcfRequestId);
        if (existing) {
            return {
                bomPcfRequestId,
                digitalTwinId: existing.digitalTwinId,
                partTypeInformationSubmodelId:
                    existing.partTypeInformationSubmodelId ?? "",
                pcfSubmodelId: existing.pcfSubmodelId,
                alreadyPublished: true,
            };
        }
    }

    const input = await buildEnviraanPcfInputFromRequest(bomPcfRequestId);

    const twin = await createProductTwin({
        manufacturerId: input.companyBpn,
        manufacturerPartId: input.productCode,
        nameAtManufacturer: input.productName,
        productDescription: input.productDescription,
    });

    const submodel = await addPcfSubmodel(twin.digitalTwinId, input);

    const partTypeInformationSubmodelId = twin.submodelIds[0]?.submodelId ?? "";
    const catenaXId = twin.submodelIds[0]?.catenaXId ?? null;

    await recordPublication({
        bomPcfRequestId,
        productCode: input.productCode,
        digitalTwinId: twin.digitalTwinId,
        partTypeInformationSubmodelId,
        pcfSubmodelId: submodel.submodelId,
        catenaXId,
        pushedOverallPcf: input.totalPcfValue,
    });

    return {
        bomPcfRequestId,
        digitalTwinId: twin.digitalTwinId,
        partTypeInformationSubmodelId,
        pcfSubmodelId: submodel.submodelId,
        alreadyPublished: false,
    };
}
