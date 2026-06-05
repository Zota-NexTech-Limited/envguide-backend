import { withClient } from "../util/database.js";
import { generateResponse } from "../util/genRes.js";
import { publishPcfRequestToQuintari } from "../services/quintariPublishService.js";
import { findPublicationByBomPcfRequestId } from "../repositories/pcfRequestRepository.js";

async function isSuperAdmin(userId: string): Promise<boolean> {
    return withClient(async (client: any) => {
        const r = await client.query(
            `SELECT user_role FROM users_table WHERE user_id = $1`,
            [userId]
        );
        const role = String(r.rows[0]?.user_role || "").toLowerCase();
        return role === "superadmin" || role === "super admin";
    });
}

export async function publishPcfToQuintari(req: any, res: any) {
    try {
        if (!req.user_id) {
            return res.status(401).send(generateResponse(false, "not authenticated", 401, null));
        }
        if (!(await isSuperAdmin(req.user_id))) {
            return res.status(403).send(generateResponse(false, "super admin only", 403, null));
        }

        const bomPcfRequestId = req.params.bomPcfRequestId || req.body?.bomPcfRequestId;
        if (!bomPcfRequestId) {
            return res.status(400).send(generateResponse(false, "bomPcfRequestId required", 400, null));
        }

        const force = req.body?.force === true || req.query?.force === "true";
        console.log(
            `[quintari-publish] user=${req.user_id} bomPcfRequestId=${bomPcfRequestId} force=${force}`
        );
        const result = await publishPcfRequestToQuintari(bomPcfRequestId, { force });

        const message = result.alreadyPublished
            ? "PCF already published to Quintari"
            : "PCF published to Quintari";
        console.log(
            `[quintari-publish] ${result.alreadyPublished ? "ALREADY-PUBLISHED" : "PUBLISHED"} ` +
                `twin=${result.digitalTwinId} pcfSubmodel=${result.pcfSubmodelId}`
        );
        return res.status(200).send(generateResponse(true, message, 200, result));
    } catch (error: any) {
        console.error("publishPcfToQuintari error:", error);
        const msg = error?.response?.data
            ? `Quintari error: ${JSON.stringify(error.response.data)}`
            : (error?.message || "publish failed");
        return res.status(500).send(generateResponse(false, msg, 500, null));
    }
}

export async function getQuintariPublicationStatus(req: any, res: any) {
    try {
        if (!req.user_id) {
            return res.status(401).send(generateResponse(false, "not authenticated", 401, null));
        }
        const bomPcfRequestId = req.params.bomPcfRequestId;
        if (!bomPcfRequestId) {
            return res.status(400).send(generateResponse(false, "bomPcfRequestId required", 400, null));
        }
        const existing = await findPublicationByBomPcfRequestId(bomPcfRequestId);
        return res
            .status(200)
            .send(generateResponse(true, "ok", 200, { published: !!existing, publication: existing ?? null }));
    } catch (error: any) {
        console.error("getQuintariPublicationStatus error:", error);
        return res.status(500).send(generateResponse(false, error?.message || "status failed", 500, null));
    }
}
