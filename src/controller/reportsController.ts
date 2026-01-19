import { withClient } from '../util/database';
import { generateResponse } from '../util/genRes';

export async function getProductFootPrint(req: any, res: any) {
    const {
        pageNumber = 1,
        pageSize = 20
    } = req.query;

    const limit = Number(pageSize);
    const page = Number(pageNumber) > 0 ? Number(pageNumber) : 1;
    const offset = (page - 1) * limit;

    return withClient(async (client: any) => {
        try {
            const query = `
SELECT
    b.id,
    b.code,
    b.material_number,
    b.component_name,
    b.qunatity,
    b.production_location,
    b.manufacturer,
    b.detail_description,
    b.weight_gms,
    b.total_weight_gms,
    b.component_category,
    b.price,
    b.total_price,
    b.economic_ratio,
    b.supplier_id,
    b.is_weight_gms,
    b.created_date,

      /* ---------- SUPPLIER DETAILS ---------- */
    jsonb_build_object(
        'sup_id', sd.sup_id,
        'code', sd.code,
        'supplier_name', sd.supplier_name,
        'supplier_email', sd.supplier_email
    ) AS supplier_details,

    /* ---------- MATERIAL EMISSION ---------- */
    (
        SELECT jsonb_agg(to_jsonb(mem))
        FROM bom_emission_material_calculation_engine mem
        WHERE mem.bom_id = b.id
    ) AS material_emission,

    /* ---------- PRODUCTION EMISSION ---------- */
    (
        SELECT to_jsonb(mep)
        FROM bom_emission_production_calculation_engine mep
        WHERE mep.bom_id = b.id
        LIMIT 1
    ) AS production_emission_calculation,

    /* ---------- PACKAGING EMISSION ---------- */
    (
        SELECT to_jsonb(mpk)
        FROM bom_emission_packaging_calculation_engine mpk
        WHERE mpk.bom_id = b.id
        LIMIT 1
    ) AS packaging_emission_calculation,

    /* ---------- WASTE EMISSION ---------- */
    (
        SELECT to_jsonb(mw)
        FROM bom_emission_waste_calculation_engine mw
        WHERE mw.bom_id = b.id
        LIMIT 1
    ) AS waste_emission_calculation,

    /* ---------- LOGISTIC EMISSION ---------- */
    (
        SELECT to_jsonb(ml)
        FROM bom_emission_logistic_calculation_engine ml
        WHERE ml.bom_id = b.id
        LIMIT 1
    ) AS logistic_emission_calculation,

    /* ---------- TOTAL PCF ---------- */
    (
        SELECT to_jsonb(pcfe)
        FROM bom_emission_calculation_engine pcfe
        WHERE pcfe.bom_id = b.id
        LIMIT 1
    ) AS pcf_total_emission_calculation,

    /* ---------- TRANSPORTATION DETAILS ---------- */
    COALESCE(transport.transportation_details, '[]'::jsonb) AS transportation_details,

    /* ---------- ALLOCATION METHODOLOGY ---------- */
    (
        SELECT to_jsonb(am)
        FROM allocation_methodology am
        WHERE am.bom_id = b.id
        LIMIT 1
    ) AS allocation_methodology

FROM bom b
LEFT JOIN supplier_details sd
    ON sd.sup_id = b.supplier_id

/* ---------- TRANSPORTATION (LATERAL) ---------- */
LEFT JOIN LATERAL (
    SELECT jsonb_agg(
        jsonb_build_object(
            'motuft_id', mt.motuft_id,
            'mode_of_transport', mt.mode_of_transport,
            'weight_transported', mt.weight_transported,
            'source_point', mt.source_point,
            'drop_point', mt.drop_point,
            'distance', mt.distance,
            'created_date', mt.created_date
        )
    ) AS transportation_details
    FROM supplier_general_info_questions sgiq
    JOIN scope_three_other_indirect_emissions_questions stoie
        ON stoie.sgiq_id = sgiq.sgiq_id
    JOIN mode_of_transport_used_for_transportation_questions mt
        ON mt.stoie_id = stoie.stoie_id
    WHERE sgiq.sup_id = b.supplier_id
) transport ON TRUE

WHERE b.is_bom_calculated = TRUE
ORDER BY b.created_date DESC
LIMIT $1 OFFSET $2;
`;

            const result = await client.query(query, [limit, offset]);

            return res.status(200).send(
                generateResponse(true, "Success!", 200, {
                    page,
                    pageSize: limit,
                    data: result.rows
                })
            );

        } catch (error: any) {
            console.error("Error fetching BOM list:", error);
            return res.status(500).json({
                success: false,
                message: error.message || "Failed to fetch BOM list"
            });
        }
    });
}

// in this below api need to add two more data emission factor and supplier emission need calrification from abhiram
export async function getSupplierFootPrint(req: any, res: any) {
    const {
        pageNumber = 1,
        pageSize = 20
    } = req.query;

    const limit = Number(pageSize);
    const page = Number(pageNumber) > 0 ? Number(pageNumber) : 1;
    const offset = (page - 1) * limit;

    return withClient(async (client: any) => {
        try {
            const query = `
SELECT
    b.id,
    b.code,
    b.material_number,
    b.component_name,
    b.qunatity,
    b.production_location,
    b.manufacturer,
    b.detail_description,
    b.weight_gms,
    b.total_weight_gms,
    b.component_category,
    b.price,
    b.total_price,
    b.economic_ratio,
    b.supplier_id,
    b.is_weight_gms,
    b.created_date,

    /* ---------- SUPPLIER DETAILS ---------- */
    jsonb_build_object(
        'sup_id', sd.sup_id,
        'code', sd.code,
        'supplier_name', sd.supplier_name,
        'supplier_email', sd.supplier_email
    ) AS supplier_details,

    /* ---------- Q13 : PRODUCTION SITE DETAILS ---------- */
    COALESCE(q13.q13_data, '[]'::jsonb) AS "Q13_data",

    /* ---------- Q52 : RAW MATERIAL TYPE DETAILS ---------- */
    COALESCE(q52.q52_material_type_data, '[]'::jsonb) AS "Q52_material_type_data",

      /* ---------- SCOPE 2 : PURCHASED ENERGY ---------- */
    COALESCE(q22.Q22_energy_type_and_energy_quantity, '[]'::jsonb) AS "Q22_energy_type_and_energy_quantity",

     /* ---------- Q51 : ENERGY CONSUMPTION ---------- */
    COALESCE(q51.q51_energy_type_and_energy_quantity, '[]'::jsonb) AS "Q51_energy_type_and_energy_quantity",

     /* ---------- Q67 : ENERGY CONSUMPTION ---------- */
    COALESCE(q67.q67_energy_type_and_energy_quantity, '[]'::jsonb) AS "Q67_energy_type_and_energy_quantity",

    /* ---------- Q56 : Recycled Material ---------- */
    COALESCE(q56.q56_recycled_material_data, '[]'::jsonb) AS "q56_recycled_material_data"
FROM bom b

LEFT JOIN supplier_details sd
    ON sd.sup_id = b.supplier_id

/* ---------- Q13 : PRODUCTION SITE DETAILS ---------- */
LEFT JOIN LATERAL (
    SELECT jsonb_agg(
        jsonb_build_object(
            'psd_id', psd.psd_id,
            'spq_id', psd.spq_id,
            'bom_id', psd.bom_id,
            'material_number', psd.material_number,
            'product_name', psd.product_name,
            'location', psd.location,
            'created_date', psd.created_date
        )
    ) AS q13_data
    FROM production_site_details_questions psd
    WHERE psd.bom_id = b.id
) q13 ON TRUE

/* ---------- Q52 : RAW MATERIALS USED ---------- */
LEFT JOIN LATERAL (
    SELECT jsonb_agg(
        jsonb_build_object(
            'rmuicm_id', rm.rmuicm_id,
            'stoie_id', rm.stoie_id,
            'bom_id', rm.bom_id,
            'material_number', rm.material_number,
            'material_name', rm.material_name,
            'percentage', rm.percentage,
            'created_date', rm.created_date
        )
    ) AS q52_material_type_data
    FROM raw_materials_used_in_component_manufacturing_questions rm
    WHERE rm.bom_id = b.id
) q52 ON TRUE

/* ---------- SCOPE 2 : PURCHASED ENERGY ---------- */
LEFT JOIN LATERAL (
    SELECT jsonb_agg(
        jsonb_build_object(
            'stidefpe_id', pe.stidefpe_id,
            'stide_id', pe.stide_id,
            'energy_source', pe.energy_source,
            'energy_type', pe.energy_type,
            'quantity', pe.quantity,
            'unit', pe.unit,
            'sup_id', pe.sup_id,
            'created_date', pe.created_date
        )
    ) AS Q22_energy_type_and_energy_quantity
    FROM supplier_general_info_questions sgiq
    JOIN scope_two_indirect_emissions_questions stide
        ON stide.sgiq_id = sgiq.sgiq_id
    JOIN scope_two_indirect_emissions_from_purchased_energy_questions pe
        ON pe.stide_id = stide.stide_id
    WHERE sgiq.bom_pcf_id = b.bom_pcf_id
) q22 ON TRUE

/* ---------- Q51 : ENERGY CONSUMPTION ---------- */
LEFT JOIN LATERAL (
    SELECT jsonb_agg(
        jsonb_build_object(
            'ecfqfo_id', ec.ecfqfo_id,
            'stide_id', ec.stide_id,
            'energy_purchased', ec.energy_purchased,
            'energy_type', ec.energy_type,
            'quantity', ec.quantity,
            'unit', ec.unit,
            'created_date', ec.created_date
        )
    ) AS q51_energy_type_and_energy_quantity
    FROM supplier_general_info_questions sgiq
    JOIN scope_two_indirect_emissions_questions stide
        ON stide.sgiq_id = sgiq.sgiq_id
    JOIN energy_consumption_for_qfiftyone_questions ec
        ON ec.stide_id = stide.stide_id
    WHERE sgiq.bom_pcf_id = b.bom_pcf_id
) q51 ON TRUE

/* ---------- Q67 join (NEW) ---------- */
LEFT JOIN LATERAL (
    SELECT jsonb_agg(
        jsonb_build_object(
            'ecfqss_id', ec.ecfqss_id,
            'stoie_id', ec.stoie_id,
            'energy_purchased', ec.energy_purchased,
            'energy_type', ec.energy_type,
            'quantity', ec.quantity,
            'unit', ec.unit,
            'created_date', ec.created_date
        )
    ) AS q67_energy_type_and_energy_quantity
    FROM supplier_general_info_questions sgiq
    JOIN scope_three_other_indirect_emissions_questions stoie
        ON stoie.sgiq_id = sgiq.sgiq_id
    JOIN energy_consumption_for_qsixtyseven_questions ec
        ON ec.stoie_id = stoie.stoie_id
    WHERE sgiq.bom_pcf_id = b.bom_pcf_id
) q67 ON TRUE

/* ---------- Q56 : Recycled materials with percentage ---------- */
LEFT JOIN LATERAL (
    SELECT jsonb_agg(
        jsonb_build_object(
            'rmwp_id', rmd.rmwp_id,
            'stoie_id', rmd.stoie_id,
            'bom_id', rmd.bom_id,
            'material_number', rmd.material_number,
            'material_name', rmd.material_name,
            'percentage', rmd.percentage
        )
    ) AS q56_recycled_material_data
    FROM recycled_materials_with_percentage_questions rmd
    WHERE rmd.bom_id = b.id
) q56 ON TRUE

WHERE b.is_bom_calculated = TRUE
ORDER BY b.created_date DESC
LIMIT $1 OFFSET $2;
`;

            const result = await client.query(query, [limit, offset]);

            return res.status(200).send(
                generateResponse(true, "Success!", 200, {
                    page,
                    pageSize: limit,
                    data: result.rows
                })
            );

        } catch (error: any) {
            console.error("Error fetching Supplier Footprint:", error);
            return res.status(500).json({
                success: false,
                message: error.message || "Failed to fetch Supplier Footprint"
            });
        }
    });
}

// in this below api need to add two more data weight in kg and emission factor need calrification from abhiram
export async function getMaterialFootPrint(req: any, res: any) {
    const {
        pageNumber = 1,
        pageSize = 20
    } = req.query;

    const limit = Number(pageSize);
    const page = Number(pageNumber) > 0 ? Number(pageNumber) : 1;
    const offset = (page - 1) * limit;

    return withClient(async (client: any) => {
        try {
            const query = `
SELECT
    b.id,
    b.code,
    b.material_number,
    b.component_name,
    b.qunatity,
    b.production_location,
    b.manufacturer,
    b.detail_description,
    b.weight_gms,
    b.total_weight_gms,
    b.component_category,
    b.price,
    b.total_price,
    b.economic_ratio,
    b.supplier_id,
    b.is_weight_gms,
    b.created_date,

    /* ---------- SUPPLIER DETAILS ---------- */
    jsonb_build_object(
        'sup_id', sd.sup_id,
        'code', sd.code,
        'supplier_name', sd.supplier_name,
        'supplier_email', sd.supplier_email
    ) AS supplier_details,


    /* ---------- Q52 : RAW MATERIAL TYPE DETAILS ---------- */
    COALESCE(q52.q52_material_type_data, '[]'::jsonb) AS "Q52_material_type_data",

    /* ---------- Q56 : Recycled Material ---------- */
    COALESCE(q56.q56_recycled_material_data, '[]'::jsonb) AS "q56_recycled_material_data"
FROM bom b

LEFT JOIN supplier_details sd
    ON sd.sup_id = b.supplier_id


/* ---------- Q52 : RAW MATERIALS USED ---------- */
LEFT JOIN LATERAL (
    SELECT jsonb_agg(
        jsonb_build_object(
            'rmuicm_id', rm.rmuicm_id,
            'stoie_id', rm.stoie_id,
            'bom_id', rm.bom_id,
            'material_number', rm.material_number,
            'material_name', rm.material_name,
            'percentage', rm.percentage,
            'created_date', rm.created_date
        )
    ) AS q52_material_type_data
    FROM raw_materials_used_in_component_manufacturing_questions rm
    WHERE rm.bom_id = b.id
) q52 ON TRUE

/* ---------- Q56 : Recycled materials with percentage ---------- */
LEFT JOIN LATERAL (
    SELECT jsonb_agg(
        jsonb_build_object(
            'rmwp_id', rmd.rmwp_id,
            'stoie_id', rmd.stoie_id,
            'bom_id', rmd.bom_id,
            'material_number', rmd.material_number,
            'material_name', rmd.material_name,
            'percentage', rmd.percentage
        )
    ) AS q56_recycled_material_data
    FROM recycled_materials_with_percentage_questions rmd
    WHERE rmd.bom_id = b.id
) q56 ON TRUE

WHERE b.is_bom_calculated = TRUE
ORDER BY b.created_date DESC
LIMIT $1 OFFSET $2;
`;

            const result = await client.query(query, [limit, offset]);

            return res.status(200).send(
                generateResponse(true, "Success!", 200, {
                    page,
                    pageSize: limit,
                    data: result.rows
                })
            );

        } catch (error: any) {
            console.error("Error fetching Supplier Footprint:", error);
            return res.status(500).json({
                success: false,
                message: error.message || "Failed to fetch Supplier Footprint"
            });
        }
    });
}

// in this below api need to add two more data emission factor kg and emission need calrification from abhiram
export async function getElectricityFootPrint(req: any, res: any) {
    const {
        pageNumber = 1,
        pageSize = 20
    } = req.query;

    const limit = Number(pageSize);
    const page = Number(pageNumber) > 0 ? Number(pageNumber) : 1;
    const offset = (page - 1) * limit;

    return withClient(async (client: any) => {
        try {
            const query = `
SELECT
    b.id,
    b.code,
    b.material_number,
    b.component_name,
    b.qunatity,
    b.production_location,
    b.manufacturer,
    b.detail_description,
    b.weight_gms,
    b.total_weight_gms,
    b.component_category,
    b.price,
    b.total_price,
    b.economic_ratio,
    b.supplier_id,
    b.is_weight_gms,
    b.created_date,

    /* ---------- SUPPLIER DETAILS ---------- */
    jsonb_build_object(
        'sup_id', sd.sup_id,
        'code', sd.code,
        'supplier_name', sd.supplier_name,
        'supplier_email', sd.supplier_email
    ) AS supplier_details,

      /* ---------- SCOPE 2 : PURCHASED ENERGY ---------- */
    COALESCE(q22.Q22_energy_type_and_energy_quantity, '[]'::jsonb) AS "Q22_energy_type_and_energy_quantity",

     /* ---------- Q51 : ENERGY CONSUMPTION ---------- */
    COALESCE(q51.q51_energy_type_and_energy_quantity, '[]'::jsonb) AS "Q51_energy_type_and_energy_quantity",

     /* ---------- Q67 : ENERGY CONSUMPTION ---------- */
    COALESCE(q67.q67_energy_type_and_energy_quantity, '[]'::jsonb) AS "Q67_energy_type_and_energy_quantity"
FROM bom b

LEFT JOIN supplier_details sd
    ON sd.sup_id = b.supplier_id

/* ---------- SCOPE 2 : PURCHASED ENERGY ---------- */
LEFT JOIN LATERAL (
    SELECT jsonb_agg(
        jsonb_build_object(
            'stidefpe_id', pe.stidefpe_id,
            'stide_id', pe.stide_id,
            'energy_source', pe.energy_source,
            'energy_type', pe.energy_type,
            'quantity', pe.quantity,
            'unit', pe.unit,
            'sup_id', pe.sup_id,
            'created_date', pe.created_date
        )
    ) AS Q22_energy_type_and_energy_quantity
    FROM supplier_general_info_questions sgiq
    JOIN scope_two_indirect_emissions_questions stide
        ON stide.sgiq_id = sgiq.sgiq_id
    JOIN scope_two_indirect_emissions_from_purchased_energy_questions pe
        ON pe.stide_id = stide.stide_id
    WHERE sgiq.bom_pcf_id = b.bom_pcf_id
) q22 ON TRUE

/* ---------- Q51 : ENERGY CONSUMPTION ---------- */
LEFT JOIN LATERAL (
    SELECT jsonb_agg(
        jsonb_build_object(
            'ecfqfo_id', ec.ecfqfo_id,
            'stide_id', ec.stide_id,
            'energy_purchased', ec.energy_purchased,
            'energy_type', ec.energy_type,
            'quantity', ec.quantity,
            'unit', ec.unit,
            'created_date', ec.created_date
        )
    ) AS q51_energy_type_and_energy_quantity
    FROM supplier_general_info_questions sgiq
    JOIN scope_two_indirect_emissions_questions stide
        ON stide.sgiq_id = sgiq.sgiq_id
    JOIN energy_consumption_for_qfiftyone_questions ec
        ON ec.stide_id = stide.stide_id
    WHERE sgiq.bom_pcf_id = b.bom_pcf_id
) q51 ON TRUE

/* ---------- Q67 join (NEW) ---------- */
LEFT JOIN LATERAL (
    SELECT jsonb_agg(
        jsonb_build_object(
            'ecfqss_id', ec.ecfqss_id,
            'stoie_id', ec.stoie_id,
            'energy_purchased', ec.energy_purchased,
            'energy_type', ec.energy_type,
            'quantity', ec.quantity,
            'unit', ec.unit,
            'created_date', ec.created_date
        )
    ) AS q67_energy_type_and_energy_quantity
    FROM supplier_general_info_questions sgiq
    JOIN scope_three_other_indirect_emissions_questions stoie
        ON stoie.sgiq_id = sgiq.sgiq_id
    JOIN energy_consumption_for_qsixtyseven_questions ec
        ON ec.stoie_id = stoie.stoie_id
    WHERE sgiq.bom_pcf_id = b.bom_pcf_id
) q67 ON TRUE

WHERE b.is_bom_calculated = TRUE
ORDER BY b.created_date DESC
LIMIT $1 OFFSET $2;
`;

            const result = await client.query(query, [limit, offset]);

            return res.status(200).send(
                generateResponse(true, "Success!", 200, {
                    page,
                    pageSize: limit,
                    data: result.rows
                })
            );

        } catch (error: any) {
            console.error("Error fetching Supplier Footprint:", error);
            return res.status(500).json({
                success: false,
                message: error.message || "Failed to fetch Supplier Footprint"
            });
        }
    });
}

// in this below api need to add two more data Fuel or Energy Source and emission factor need calrification from abhiram
export async function getTransportationFootPrint(req: any, res: any) {
    const {
        pageNumber = 1,
        pageSize = 20
    } = req.query;

    const limit = Number(pageSize);
    const page = Number(pageNumber) > 0 ? Number(pageNumber) : 1;
    const offset = (page - 1) * limit;

    return withClient(async (client: any) => {
        try {
            const query = `
SELECT
    b.id,
    b.code,
    b.material_number,
    b.component_name,
    b.qunatity,
    b.production_location,
    b.manufacturer,
    b.detail_description,
    b.weight_gms,
    b.total_weight_gms,
    b.component_category,
    b.price,
    b.total_price,
    b.economic_ratio,
    b.supplier_id,
    b.is_weight_gms,
    b.created_date,

    /* ---------- SUPPLIER DETAILS ---------- */
    jsonb_build_object(
        'sup_id', sd.sup_id,
        'code', sd.code,
        'supplier_name', sd.supplier_name,
        'supplier_email', sd.supplier_email
    ) AS supplier_details,

     /* ---------- Q74 : ENERGY CONSUMPTION ---------- */
    COALESCE(q74.q74_transport, '[]'::jsonb) AS "Q74_transport"
FROM bom b

LEFT JOIN supplier_details sd
    ON sd.sup_id = b.supplier_id


/* ---------- Q74 join (NEW) ---------- */
LEFT JOIN LATERAL (
    SELECT jsonb_agg(
        jsonb_build_object(
            'motuft_id', ec.motuft_id,
            'stoie_id', ec.stoie_id,
            'mode_of_transport', ec.mode_of_transport,
            'weight_transported', ec.weight_transported,
            'source_point', ec.source_point,
            'drop_point', ec.drop_point,
            'distance', ec.distance
        )
    ) AS q74_transport 
    FROM supplier_general_info_questions sgiq
    JOIN scope_three_other_indirect_emissions_questions stoie
        ON stoie.sgiq_id = sgiq.sgiq_id
    JOIN mode_of_transport_used_for_transportation_questions ec
        ON ec.stoie_id = stoie.stoie_id
    WHERE sgiq.bom_pcf_id = b.bom_pcf_id
) q74 ON TRUE

WHERE b.is_bom_calculated = TRUE
ORDER BY b.created_date DESC
LIMIT $1 OFFSET $2;
`;

            const result = await client.query(query, [limit, offset]);

            return res.status(200).send(
                generateResponse(true, "Success!", 200, {
                    page,
                    pageSize: limit,
                    data: result.rows
                })
            );

        } catch (error: any) {
            console.error("Error fetching Supplier Footprint:", error);
            return res.status(500).json({
                success: false,
                message: error.message || "Failed to fetch Supplier Footprint"
            });
        }
    });
}
// in this below api need to add two more data Emission Factor (kg CO₂e / kg) and emission 0.25 and emission 0.5 need calrification from abhiram
export async function getPackagingFootPrint(req: any, res: any) {
    const {
        pageNumber = 1,
        pageSize = 20
    } = req.query;

    const limit = Number(pageSize);
    const page = Number(pageNumber) > 0 ? Number(pageNumber) : 1;
    const offset = (page - 1) * limit;

    return withClient(async (client: any) => {
        try {
            const query = `
SELECT
    b.id,
    b.code,
    b.material_number,
    b.component_name,
    b.qunatity,
    b.production_location,
    b.manufacturer,
    b.detail_description,
    b.weight_gms,
    b.total_weight_gms,
    b.component_category,
    b.price,
    b.total_price,
    b.economic_ratio,
    b.supplier_id,
    b.is_weight_gms,
    b.created_date,

    /* ---------- SUPPLIER DETAILS ---------- */
    jsonb_build_object(
        'sup_id', sd.sup_id,
        'code', sd.code,
        'supplier_name', sd.supplier_name,
        'supplier_email', sd.supplier_email
    ) AS supplier_details,

    /* ---------- Q60 : ENERGY CONSUMPTION ---------- */
    COALESCE(q60.q60_packaging_material, '[]'::jsonb) AS "Q60_packaging_material",

     /* ---------- Q67 : ENERGY CONSUMPTION ---------- */
    COALESCE(q67.q67_energy_type_and_energy_quantity, '[]'::jsonb) AS "Q67_energy_type_and_energy_quantity"


FROM bom b

LEFT JOIN supplier_details sd
    ON sd.sup_id = b.supplier_id

/* ---------- Q60 Packaging Material ---------- */
LEFT JOIN LATERAL (
    SELECT jsonb_agg(
        jsonb_build_object(
            'topmudp_id', pmu.topmudp_id,
            'stoie_id', pmu.stoie_id,
            'bom_id', pmu.bom_id,
            'material_number', pmu.material_number,
            'component_name', pmu.component_name,
            'packagin_type', pmu.packagin_type,
            'packaging_size', pmu.packaging_size,
            'unit', pmu.unit,
            'percentage_of_recycled_content_used_in_packaging',stoie.percentage_of_recycled_content_used_in_packaging
        )
    ) AS q60_packaging_material
    FROM type_of_pack_mat_used_for_delivering_questions pmu
    LEFT JOIN scope_three_other_indirect_emissions_questions stoie
        ON stoie.stoie_id = pmu.stoie_id
    WHERE pmu.bom_id = b.id
) q60 ON TRUE


/* ---------- Q67 join (NEW) ---------- */
LEFT JOIN LATERAL (
    SELECT jsonb_agg(
        jsonb_build_object(
            'ecfqss_id', ec.ecfqss_id,
            'stoie_id', ec.stoie_id,
            'energy_purchased', ec.energy_purchased,
            'energy_type', ec.energy_type,
            'quantity', ec.quantity,
            'unit', ec.unit,
            'created_date', ec.created_date
        )
    ) AS q67_energy_type_and_energy_quantity
    FROM supplier_general_info_questions sgiq
    JOIN scope_three_other_indirect_emissions_questions stoie
        ON stoie.sgiq_id = sgiq.sgiq_id
    JOIN energy_consumption_for_qsixtyseven_questions ec
        ON ec.stoie_id = stoie.stoie_id
    WHERE sgiq.bom_pcf_id = b.bom_pcf_id
) q67 ON TRUE

WHERE b.is_bom_calculated = TRUE
ORDER BY b.created_date DESC
LIMIT $1 OFFSET $2;
`;

            const result = await client.query(query, [limit, offset]);

            return res.status(200).send(
                generateResponse(true, "Success!", 200, {
                    page,
                    pageSize: limit,
                    data: result.rows
                })
            );

        } catch (error: any) {
            console.error("Error fetching Supplier Footprint:", error);
            return res.status(500).json({
                success: false,
                message: error.message || "Failed to fetch Supplier Footprint"
            });
        }
    });
}