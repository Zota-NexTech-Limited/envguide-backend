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

// Replace-all CSV import. Super admin only. Field name in form-data: "file".
Routes.post(
    "/api/emission-factors/import-csv",
    authService.authenticate,
    upload.single("file"),
    Controller.importEmissionFactorsCsv
);

export default Routes;
