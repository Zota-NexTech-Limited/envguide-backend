import { withClient } from "../util/database.js";
import { generateResponse } from "../util/genRes.js";
import {
    saveQuestionnaire,
    loadQuestionnaire,
    listByPcf,
    markSubmitted,
    validateForSubmit,
    ValidationException,
    QuestionnaireInput,
} from "../services/questionnaireService.js";
import { computePcfFields } from "../services/formulaEngine.js";
import { buildPayloadFromResponse } from "../services/payloadAssembler.js";
import { publishPcfRequestToQuintari } from "../services/quintariPublishService.js";

// ============================================================
// Role helpers — single source of truth so swapping roles is one place.
// ============================================================

async function getUserRole(userId: string): Promise<string> {
    return withClient(async (client: any) => {
        const r = await client.query(
            `SELECT user_role FROM users_table WHERE user_id = $1`,
            [userId]
        );
        return String(r.rows[0]?.user_role || "").toLowerCase();
    });
}

function isSuperAdminRole(role: string): boolean {
    return role === "superadmin" || role === "super admin";
}

function isSupplierRole(role: string): boolean {
    return role === "supplier";
}

// ============================================================
// POST /api/questionnaire/save
// Save (upsert) a questionnaire response. Supplier saves their own only;
// super admin can save on behalf of any supplier.
// ============================================================

export async function saveHandler(req: any, res: any) {
    try {
        if (!req.user_id) {
            return res.status(401).send(generateResponse(false, "not authenticated", 401, null));
        }

        const role = await getUserRole(req.user_id);
        const body = req.body as QuestionnaireInput;

        if (!body?.bomPcfRequestId || !body?.supplierId) {
            return res
                .status(400)
                .send(generateResponse(false, "bomPcfRequestId and supplierId are required", 400, null));
        }

        // Supplier may only save under their own user_id.
        if (isSupplierRole(role) && body.supplierId !== req.user_id) {
            return res
                .status(403)
                .send(generateResponse(false, "suppliers can only save their own questionnaire", 403, null));
        }
        if (!isSuperAdminRole(role) && !isSupplierRole(role)) {
            return res
                .status(403)
                .send(generateResponse(false, "only supplier or super admin can save", 403, null));
        }

        const result = await saveQuestionnaire(body);
        return res.status(200).send(generateResponse(true, "saved", 200, result));
    } catch (error: any) {
        if (error instanceof ValidationException) {
            return res.status(400).send(generateResponse(false, error.message, 400, { errors: error.errors }));
        }
        console.error("[questionnaire/save] error:", error);
        return res.status(500).send(generateResponse(false, error?.message ?? "save failed", 500, null));
    }
}

// ============================================================
// GET /api/questionnaire/:responseId
// Load a single saved response. Supplier can only load their own.
// ============================================================

export async function loadHandler(req: any, res: any) {
    try {
        if (!req.user_id) {
            return res.status(401).send(generateResponse(false, "not authenticated", 401, null));
        }
        const responseId = req.params.responseId;
        if (!responseId) {
            return res
                .status(400)
                .send(generateResponse(false, "responseId is required", 400, null));
        }

        const data = await loadQuestionnaire(responseId);
        if (!data) {
            return res.status(404).send(generateResponse(false, "response not found", 404, null));
        }

        const role = await getUserRole(req.user_id);
        if (!isSuperAdminRole(role) && data.supplierId !== req.user_id) {
            return res
                .status(403)
                .send(generateResponse(false, "you can only view your own questionnaire", 403, null));
        }

        return res.status(200).send(generateResponse(true, "ok", 200, data));
    } catch (error: any) {
        console.error("[questionnaire/load] error:", error);
        return res.status(500).send(generateResponse(false, error?.message ?? "load failed", 500, null));
    }
}

// ============================================================
// GET /api/questionnaire/by-pcf/:bomPcfRequestId
// List all supplier responses for a PCF request. Super admin only.
// ============================================================

export async function listByPcfHandler(req: any, res: any) {
    try {
        if (!req.user_id) {
            return res.status(401).send(generateResponse(false, "not authenticated", 401, null));
        }
        const role = await getUserRole(req.user_id);
        if (!isSuperAdminRole(role)) {
            return res
                .status(403)
                .send(generateResponse(false, "super admin only", 403, null));
        }

        const bomPcfRequestId = req.params.bomPcfRequestId;
        if (!bomPcfRequestId) {
            return res
                .status(400)
                .send(generateResponse(false, "bomPcfRequestId is required", 400, null));
        }

        const rows = await listByPcf(bomPcfRequestId);
        return res.status(200).send(generateResponse(true, "ok", 200, rows));
    } catch (error: any) {
        console.error("[questionnaire/listByPcf] error:", error);
        return res.status(500).send(generateResponse(false, error?.message ?? "list failed", 500, null));
    }
}

// ============================================================
// POST /api/questionnaire/submit/:responseId
// Validate mandatory fields → mark submitted → trigger formula engine.
// Supplier submits their own; super admin may submit any.
// ============================================================

export async function submitHandler(req: any, res: any) {
    try {
        if (!req.user_id) {
            return res.status(401).send(generateResponse(false, "not authenticated", 401, null));
        }
        const responseId = req.params.responseId;
        const loaded = await loadQuestionnaire(responseId);
        if (!loaded) {
            return res.status(404).send(generateResponse(false, "response not found", 404, null));
        }

        const role = await getUserRole(req.user_id);
        if (!isSuperAdminRole(role) && loaded.supplierId !== req.user_id) {
            return res
                .status(403)
                .send(generateResponse(false, "you can only submit your own questionnaire", 403, null));
        }

        const errors = validateForSubmit(loaded);
        if (errors.length > 0) {
            return res.status(400).send(
                generateResponse(
                    false,
                    `Submit blocked — ${errors.length} mandatory field(s) missing`,
                    400,
                    { errors }
                )
            );
        }

        await markSubmitted(responseId);
        let computed = null;
        try {
            computed = await computePcfFields(responseId);
        } catch (computeErr: any) {
            console.error(
                "[questionnaire/submit] formula engine error (submission still saved):",
                computeErr
            );
        }

        return res
            .status(200)
            .send(generateResponse(true, "submitted", 200, { responseId, computed }));
    } catch (error: any) {
        console.error("[questionnaire/submit] error:", error);
        return res.status(500).send(generateResponse(false, error?.message ?? "submit failed", 500, null));
    }
}

// ============================================================
// POST /api/questionnaire/publish/:responseId
// Assemble Catena-X v9 JSON for the supplier response → push to Quintari
// using the existing publishPcfRequestToQuintari pipeline. Super admin only.
// ============================================================

export async function publishHandler(req: any, res: any) {
    try {
        if (!req.user_id) {
            return res.status(401).send(generateResponse(false, "not authenticated", 401, null));
        }
        const role = await getUserRole(req.user_id);
        if (!isSuperAdminRole(role)) {
            return res
                .status(403)
                .send(generateResponse(false, "super admin only", 403, null));
        }

        const responseId = req.params.responseId;
        const loaded = await loadQuestionnaire(responseId);
        if (!loaded) {
            return res.status(404).send(generateResponse(false, "response not found", 404, null));
        }
        if (loaded.status !== "submitted") {
            return res
                .status(400)
                .send(generateResponse(false, "response must be submitted before publishing", 400, null));
        }

        // Build the v9 JSON (also re-runs the formula engine for freshness).
        await buildPayloadFromResponse(responseId);

        // Hand off to the existing Quintari publisher tied to the underlying PCF request.
        const result = await publishPcfRequestToQuintari(loaded.bomPcfRequestId);

        console.log(
            `[questionnaire/publish] user=${req.user_id} response=${responseId} pcf=${loaded.bomPcfRequestId} ` +
                `${result.alreadyPublished ? "ALREADY-PUBLISHED" : "PUBLISHED"} ` +
                `twin=${result.digitalTwinId} pcfSubmodel=${result.pcfSubmodelId}`
        );

        const message = result.alreadyPublished
            ? "PCF already published to Quintari"
            : "PCF published to Quintari";
        return res.status(200).send(generateResponse(true, message, 200, result));
    } catch (error: any) {
        console.error("[questionnaire/publish] error:", error);
        const msg = error?.response?.data
            ? `Quintari error: ${JSON.stringify(error.response.data)}`
            : error?.message ?? "publish failed";
        return res.status(500).send(generateResponse(false, msg, 500, null));
    }
}
