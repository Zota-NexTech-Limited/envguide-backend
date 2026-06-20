import express from "express";
import multer from "multer";
import * as Controller from "../../controller/emissionFactorController.js";
import * as authService from "../../middleware/authService.js";

const Routes = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB cap (BAFU 2025 CSV ~11k rows ≈ 5 MB)
});

// List + filter + paginate the emission_factors master table.
Routes.get(
    "/api/emission-factors/list",
    authService.authenticate,
    Controller.listEmissionFactors
);

// Fetch a single emission factor by ef_id.
Routes.get(
    "/api/emission-factors/:ef_id",
    authService.authenticate,
    Controller.getEmissionFactorById
);

// Summary stats (total rows, distinct sources/countries) for Settings card.
Routes.get(
    "/api/emission-factors/meta/stats",
    authService.authenticate,
    Controller.getEmissionFactorStats
);

// Distinct unit values for the Unit filter dropdown on the Settings page.
Routes.get(
    "/api/emission-factors/meta/units",
    authService.authenticate,
    Controller.getEmissionFactorUnits
);

// Distinct (country_code, country_name) pairs for the Country filter dropdown.
Routes.get(
    "/api/emission-factors/meta/countries",
    authService.authenticate,
    Controller.getEmissionFactorCountries
);

// All distinct (category, sub_category_1, sub_category_2) triples for the
// 3-layer cascading dropdowns in the supplier questionnaire. PUBLIC (no auth)
// because suppliers access the questionnaire via a sup_id link without a JWT
// — they need to be able to populate the dropdowns. The data is reference
// metadata (BAFU EF categories), no supplier-specific or sensitive info.
Routes.get(
    "/api/emission-factors/meta/layer-triples",
    Controller.getEmissionFactorLayerTriples
);

// Match an EF row for the supplier's input via the fallback chain
// (Supplier Region > Country > Nearby > Continent > Global > Europe).
// Public because supplier preview / submit path also runs unauthenticated.
Routes.post(
    "/api/emission-factors/match",
    Controller.postMatchEmissionFactor
);

// Packaging types for the Q8 "Packaging Type" dropdown. Public (supplier).
Routes.get(
    "/api/emission-factors/meta/packaging-types",
    Controller.getPackagingTypes
);

// Resolve a material/alloy description into its constituent materials +
// weight-% + BAFU layer mapping, to auto-populate Q7 raw materials. Public:
// suppliers call it from the questionnaire (sup_id link, no JWT).
Routes.post(
    "/api/emission-factors/material-composition",
    Controller.postMaterialComposition
);

// Preview raw-material emissions calculation (verify against the PCF sheet).
Routes.post(
    "/api/emission-factors/raw-materials-preview",
    Controller.postRawMaterialsPreview
);

// Preview production/electricity emission calculation.
Routes.post(
    "/api/emission-factors/production-preview",
    Controller.postProductionPreview
);

// Preview packaging emission calculation.
Routes.post(
    "/api/emission-factors/packaging-preview",
    Controller.postPackagingPreview
);

// Preview transport emission calculation (per-leg sum).
Routes.post(
    "/api/emission-factors/transport-preview",
    Controller.postTransportPreview
);

// Preview waste emission calculation (production + packaging waste).
Routes.post(
    "/api/emission-factors/waste-preview",
    Controller.postWastePreview
);

// Full PCF calculation — all 5 sections + grand total.
Routes.post(
    "/api/emission-factors/pcf-calculate",
    Controller.postPcfCalculate
);

// Full PCF from the raw supplier-questionnaire data object.
Routes.post(
    "/api/emission-factors/pcf-from-questionnaire",
    Controller.postPcfFromQuestionnaire
);

// Replace-all CSV import. Super admin only. Field name in form-data: "file".
Routes.post(
    "/api/emission-factors/import-csv",
    authService.authenticate,
    upload.single("file"),
    Controller.importEmissionFactorsCsv
);

export default Routes;
