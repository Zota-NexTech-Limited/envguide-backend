import { withClient } from '../util/database.js';

//changes mar 25, 2026
// Below code also working for product life cycle
// interface ProductLifeCycleRow {
//     product_code: string;
//     product_name: string;

//     all_raw_material_emission: string | number;
//     all_manufacturing_emission: string | number;
//     all_packaging_emission: string | number;
//     all_logistic_emission: string | number;
//     all_waste_emission: string | number;

//     total_all_product_all_emission: string | number;
// }

// export async function getProductLifeCycleEmission(req: any, res: any) {
//     return withClient(async (client: any) => {
//         try {
//             const { user_id } = req.query;

//             if (!user_id) {
//                 return res.status(400).send({
//                     success: false,
//                     message: "user_id is required"
//                 });
//             }

//             const result = await client.query(`
//                 SELECT
//                     p.product_code,
//                     p.product_name,

//                     /* ---------- Emission Sums ---------- */
//                     COALESCE(SUM(be.material_value), 0) AS all_raw_material_emission,
//                     COALESCE(SUM(be.production_value), 0) AS all_manufacturing_emission,
//                     COALESCE(SUM(be.packaging_value), 0) AS all_packaging_emission,
//                     COALESCE(SUM(be.logistic_value), 0) AS all_logistic_emission,
//                     COALESCE(SUM(be.waste_value), 0) AS all_waste_emission,

//                     /* ---------- Total ---------- */
//                     COALESCE(
//                         SUM(
//                             COALESCE(be.material_value, 0)
//                           + COALESCE(be.production_value, 0)
//                           + COALESCE(be.packaging_value, 0)
//                           + COALESCE(be.logistic_value, 0)
//                           + COALESCE(be.waste_value, 0)
//                         ), 0
//                     ) AS total_all_product_all_emission

//                 FROM bom_pcf_request bpr
//                 JOIN product p
//                     ON p.product_code = bpr.product_code
//                 JOIN bom b
//                     ON b.bom_pcf_id = bpr.id
//                 JOIN bom_emission_calculation_engine be
//                     ON be.bom_id = b.id

//                 WHERE bpr.created_by = $1

//                 GROUP BY
//                     p.product_code,
//                     p.product_name

//                 ORDER BY p.product_code
//             `, [user_id]);

//             /* ---------- percentage calculation ---------- */
//             const data = result.rows.map((row: ProductLifeCycleRow) => {
//                 const total = Number(row.total_all_product_all_emission) || 0;

//                 const safePercent = (value: number) =>
//                     total > 0 ? Number(((value / total) * 100).toFixed(2)) : 0;

//                 return {
//                     product_code: row.product_code,
//                     product_name: row.product_name,

//                     all_raw_material_emission: Number(row.all_raw_material_emission),
//                     all_manufacturing_emission: Number(row.all_manufacturing_emission),
//                     all_packaging_emission: Number(row.all_packaging_emission),
//                     all_logistic_emission: Number(row.all_logistic_emission),
//                     all_waste_emission: Number(row.all_waste_emission),

//                     total_all_product_all_emission: total,

//                     raw_material_contribution: safePercent(Number(row.all_raw_material_emission)),
//                     manufacturing_contribution: safePercent(Number(row.all_manufacturing_emission)),
//                     packaging_contribution: safePercent(Number(row.all_packaging_emission)),
//                     logistic_contribution: safePercent(Number(row.all_logistic_emission)),
//                     waste_contribution: safePercent(Number(row.all_waste_emission))
//                 };
//             });

//             return res.status(200).send({
//                 success: true,
//                 message: "Product life cycle emission fetched successfully",
//                 data
//             });

//         } catch (error: any) {
//             console.error("Product lifecycle emission error:", error);
//             return res.status(500).send({
//                 success: false,
//                 message: error.message
//             });
//         }
//     });
// }

export async function getClients(_req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const result = await client.query(`
                SELECT
                    user_id,
                    user_role,
                    user_name
                FROM users_table
                WHERE LOWER(user_role) = 'client'
                ORDER BY user_name
            `);

            return res.status(200).send({
                success: true,
                message: "Clients fetched successfully",
                data: result.rows
            });

        } catch (error: any) {
            console.error("Fetch clients error:", error);
            return res.status(500).send({
                success: false,
                message: error.message
            });
        }
    });
}

// Product Life Cycle Stage
interface ProductLifeCycleRow {
    all_raw_material_emission: string | number;
    all_manufacturing_emission: string | number;
    all_packaging_emission: string | number;
    all_logistic_emission: string | number;
    all_waste_emission: string | number;
}

export async function getProductLifeCycleEmission(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { user_id } = req.query;

            if (!user_id) {
                return res.status(400).send({
                    success: false,
                    message: "user_id is required"
                });
            }

            const result = await client.query(`
                SELECT
                    COALESCE(SUM(be.material_value), 0) AS all_raw_material_emission,
                    COALESCE(SUM(be.production_value), 0) AS all_manufacturing_emission,
                    COALESCE(SUM(be.packaging_value), 0) AS all_packaging_emission,
                    COALESCE(SUM(be.logistic_value), 0) AS all_logistic_emission,
                    COALESCE(SUM(be.waste_value), 0) AS all_waste_emission
                FROM bom_pcf_request bpr
                JOIN bom b
                    ON b.bom_pcf_id = bpr.id
                JOIN bom_emission_calculation_engine be
                    ON be.bom_id = b.id
                WHERE bpr.created_by = $1
            `, [user_id]);

            const row: ProductLifeCycleRow = result.rows[0];

            /* ---------- convert to numbers ---------- */
            const raw = Number(row.all_raw_material_emission);
            const manufacturing = Number(row.all_manufacturing_emission);
            const packaging = Number(row.all_packaging_emission);
            const logistic = Number(row.all_logistic_emission);
            const waste = Number(row.all_waste_emission);

            /* ---------- total ---------- */
            const total =
                raw +
                manufacturing +
                packaging +
                logistic +
                waste;

            const percent = (value: number) =>
                total > 0 ? Number(((value / total) * 100).toFixed(2)) : 0;

            /* ---------- FINAL GRAPH DATA ---------- */
            const graphData = {
                raw_material: percent(raw),
                manufacturing: percent(manufacturing),
                packaging: percent(packaging),
                transportation: percent(logistic),
                waste: percent(waste)
            };

            return res.status(200).send({
                success: true,
                message: "Product life cycle emission fetched successfully",
                data: graphData
            });

        } catch (error: any) {
            console.error("Product lifecycle emission error:", error);
            return res.status(500).send({
                success: false,
                message: error.message
            });
        }
    });
}

// END Another one graph are there need confirmation

// Supplier Emission Dashboard start
export async function getSupplierDropdown(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { user_id } = req.query;

            if (!user_id) {
                return res.status(400).send({
                    success: false,
                    message: "user_id is required"
                });
            }

            const result = await client.query(`
                SELECT DISTINCT
                    sd.sup_id,
                    sd.code,
                    sd.supplier_name
                FROM bom_pcf_request bpr
                JOIN bom b
                    ON b.bom_pcf_id = bpr.id
                JOIN supplier_details sd
                    ON sd.sup_id = b.supplier_id
                WHERE bpr.created_by = $1
                ORDER BY sd.supplier_name
            `, [user_id]);

            return res.status(200).send({
                success: true,
                message: "Supplier dropdown fetched successfully",
                data: result.rows
            });

        } catch (error: any) {
            console.error("Supplier dropdown error:", error);
            return res.status(500).send({
                success: false,
                message: error.message
            });
        }
    });
}

interface SupplierEmissionRow {
    component_name: string;
    overall_total_pcf: string | number;
}

export async function getSupplierEmission(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { client_id, supplier_id } = req.query;

            if (!client_id || !supplier_id) {
                return res.status(400).send({
                    success: false,
                    message: "client_id and supplier_id are required"
                });
            }

            const result = await client.query(
                `
                SELECT
                    b.component_name,
                    COALESCE(
                        SUM(be.total_pcf_value),
                        0
                    ) AS overall_total_pcf
                FROM bom_pcf_request bpr
                JOIN bom b
                    ON b.bom_pcf_id = bpr.id
                JOIN bom_emission_calculation_engine be
                    ON be.bom_id = b.id
                WHERE
                    bpr.created_by = $1
                    AND b.supplier_id = $2
                GROUP BY
                    b.component_name
                ORDER BY
                    b.component_name
                `,
                [client_id, supplier_id]
            );

            const data = result.rows.map((row: SupplierEmissionRow) => ({
                component_name: row.component_name,
                overall_total_pcf: Number(row.overall_total_pcf)
            }));

            return res.status(200).send({
                success: true,
                message: "Supplier emission fetched successfully",
                data
            });

        } catch (error: any) {
            console.error("Supplier emission error:", error);
            return res.status(500).send({
                success: false,
                message: error.message
            });
        }
    });
}

export async function getComponentDropdown(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { client_id } = req.query;

            if (!client_id) {
                return res.status(400).send({
                    success: false,
                    message: "client_id is required"
                });
            }

            const result = await client.query(
                `
                SELECT DISTINCT
                    b.component_name
                FROM bom_pcf_request bpr
                JOIN bom b
                    ON b.bom_pcf_id = bpr.id
                WHERE
                    bpr.created_by = $1
                    AND b.component_name IS NOT NULL
                ORDER BY
                    b.component_name
                `,
                [client_id]
            );

            const data = result.rows.map((row: { component_name: string }) => ({
                component_name: row.component_name
            }));

            return res.status(200).send({
                success: true,
                message: "Component dropdown fetched successfully",
                data
            });

        } catch (error: any) {
            console.error("Component dropdown error:", error);
            return res.status(500).send({
                success: false,
                message: error.message
            });
        }
    });
}

interface SupplierMaterialEmissionRow {
    supplier_id: string;
    supplier_code: string;
    supplier_name: string;
    total_material_emission: number;
}

export async function getSupplierMaterialEmissionComparison(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { client_id, component_name } = req.query;

            if (!client_id || !component_name) {
                return res.status(400).send({
                    success: false,
                    message: "client_id and component_name are required"
                });
            }

            const result = await client.query(
                `
                SELECT
                    s.sup_id AS supplier_id,
                    s.code AS supplier_code,
                    s.supplier_name,

                    /* -------- Material Emission -------- */
                    COALESCE(SUM(be.material_value), 0) AS total_material_emission

                FROM bom_pcf_request bpr
                JOIN bom b
                    ON b.bom_pcf_id = bpr.id
                JOIN bom_emission_calculation_engine be
                    ON be.bom_id = b.id
                JOIN supplier_details s
                    ON s.sup_id = b.supplier_id

                WHERE
                    bpr.created_by = $1
                    AND b.component_name = $2

                GROUP BY
                    s.sup_id,
                    s.code,
                    s.supplier_name

                ORDER BY
                    total_material_emission DESC
                `,
                [client_id, component_name]
            );

            const data: SupplierMaterialEmissionRow[] = result.rows.map(
                (row: SupplierMaterialEmissionRow) => ({
                    supplier_id: row.supplier_id,
                    supplier_code: row.supplier_code,
                    supplier_name: row.supplier_name,
                    total_material_emission: Number(row.total_material_emission)
                })
            );

            return res.status(200).send({
                success: true,
                message: "Supplier material emission comparison fetched successfully",
                data
            });

        } catch (error: any) {
            console.error("Supplier material emission comparison error:", error);
            return res.status(500).send({
                success: false,
                message: error.message
            });
        }
    });
}

// export async function getManufacturingProcessEmission(req: any, res: any) {
//     return withClient(async (client: any) => {
//         try {
//             const { client_id } = req.query;

//             if (!client_id) {
//                 return res.status(400).send({
//                     success: false,
//                     message: "client_id is required"
//                 });
//             }

//             const result = await client.query(
//                 `
//                 SELECT
//                     pseq.process_specific_energy_type,
//                     pseq.unit,
//                     pseq.annual_reporting_period,

//                     /* Sum quantity per energy type */
//                     SUM(pseq.quantity_consumed) AS quantity_consumed,

//                     /* Location */
//                     LOWER(psd.location) AS location,

//                     /* Emission factors */
//                     eef.ef_india_region,
//                     eef.ef_eu_region,
//                     eef.ef_global_region

//                 FROM bom_pcf_request bpr
//                 JOIN bom b
//                     ON b.bom_pcf_id = bpr.id
//                 JOIN process_specific_energy_usage_questions pseq
//                     ON pseq.bom_id = b.id
//                 JOIN production_site_details_questions psd
//                     ON psd.bom_id = b.id
//                 JOIN electricity_emission_factor eef
//                     ON eef.type_of_energy = pseq.energy_type
//                     AND eef.unit = pseq.unit
//                     AND eef.year = pseq.annual_reporting_period

//                 WHERE
//                     bpr.created_by = $1

//                 GROUP BY
//                     pseq.process_specific_energy_type,
//                     pseq.unit,
//                     pseq.annual_reporting_period,
//                     psd.location,
//                     eef.ef_india_region,
//                     eef.ef_eu_region,
//                     eef.ef_global_region
//                 `,
//                 [client_id]
//             );

//             const data = result.rows.map((row: any) => {
//                 let emission_value = 0;

//                 if (row.location === "india") {
//                     emission_value = parseFloat(row.ef_india_region);
//                 }

//                 if (row.location === "europe") {
//                     emission_value = parseFloat(row.ef_eu_region);
//                 }

//                 if (row.location === "global") {
//                     emission_value = parseFloat(row.ef_global_region);
//                 }

//                 const quantity = parseFloat(row.quantity_consumed) || 0;
//                 const total_emission_value = quantity * emission_value;

//                 return {
//                     process_specific_energy_type: row.process_specific_energy_type,
//                     quantity_consumed: quantity,
//                     emission_value: emission_value,
//                     total_emission_value: total_emission_value
//                 };
//             });

//             return res.status(200).send({
//                 success: true,
//                 message: "Manufacturing process emission fetched successfully",
//                 data
//             });

//         } catch (error: any) {
//             console.error("Manufacturing process emission error:", error);
//             return res.status(500).send({
//                 success: false,
//                 message: error.message
//             });
//         }
//     });
// }
export async function getManufacturingProcessEmission(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { client_id } = req.query;

            if (!client_id) {
                return res.status(400).send({
                    success: false,
                    message: "client_id is required"
                });
            }

            // const result = await client.query(
            //     `
            //     SELECT
            //         pseq.process_specific_energy_type,

            //         /* total quantity per process */
            //         SUM(pseq.quantity_consumed) AS quantity_consumed,

            //         /* emission factor based on location */
            //         CASE
            //             WHEN LOWER(psd.location) = 'india'
            //                 THEN AVG(eef.ef_india_region::numeric)
            //             WHEN LOWER(psd.location) = 'europe'
            //                 THEN AVG(eef.ef_eu_region::numeric)
            //             ELSE
            //                 AVG(eef.ef_global_region::numeric)
            //         END AS emission_value,

            //         /* total emission */
            //         SUM(
            //             pseq.quantity_consumed *
            //             CASE
            //                 WHEN LOWER(psd.location) = 'india'
            //                     THEN eef.ef_india_region::numeric
            //                 WHEN LOWER(psd.location) = 'europe'
            //                     THEN eef.ef_eu_region::numeric
            //                 ELSE
            //                     eef.ef_global_region::numeric
            //             END
            //         ) AS total_emission_value

            //     FROM bom_pcf_request bpr
            //     JOIN bom b
            //         ON b.bom_pcf_id = bpr.id
            //     JOIN process_specific_energy_usage_questions pseq
            //         ON pseq.bom_id = b.id
            //     JOIN production_site_details_questions psd
            //         ON psd.bom_id = b.id
            //     JOIN electricity_emission_factor eef
            //         ON eef.type_of_energy = pseq.energy_type
            //         AND eef.unit = pseq.unit
            //         AND eef.year = pseq.annual_reporting_period

            //     WHERE
            //         bpr.created_by = $1

            //     GROUP BY
            //         pseq.process_specific_energy_type,
            //         psd.location
            //     `,
            //     [client_id]
            // );

            const result = await client.query(
                `
SELECT
    pseq.process_specific_energy_type,

    /* total quantity per process */
    SUM(pseq.quantity_consumed) AS quantity_consumed,

    /* emission factor based on location */
    CASE
        WHEN psd.location = 'india'
            THEN COALESCE(AVG(eef.ef_india_region::numeric), 0)
        WHEN psd.location = 'europe'
            THEN COALESCE(AVG(eef.ef_eu_region::numeric), 0)
        ELSE
            COALESCE(AVG(eef.ef_global_region::numeric), 0)
    END AS emission_value,

    /* total emission */
    COALESCE(SUM(
        pseq.quantity_consumed *
        CASE
            WHEN psd.location = 'india'
                THEN COALESCE(eef.ef_india_region::numeric, 0)
            WHEN psd.location = 'europe'
                THEN COALESCE(eef.ef_eu_region::numeric, 0)
            ELSE
                COALESCE(eef.ef_global_region::numeric, 0)
        END
    ), 0) AS total_emission_value

FROM bom_pcf_request bpr
JOIN bom b
    ON b.bom_pcf_id = bpr.id
JOIN process_specific_energy_usage_questions pseq
    ON pseq.bom_id = b.id

/* LEFT JOIN: production site may not exist for all BOMs */
LEFT JOIN (
    SELECT DISTINCT ON (bom_id)
        bom_id,
        LOWER(location) AS location,
        LOWER(detailed_location) AS detailed_location
    FROM production_site_details_questions
    ORDER BY bom_id
) psd
    ON psd.bom_id = b.id

LEFT JOIN electricity_emission_factor eef
    ON eef.type_of_energy = pseq.energy_type
    AND eef.unit = pseq.unit
    AND eef.year = pseq.annual_reporting_period

WHERE
    bpr.created_by = $1

GROUP BY
    pseq.process_specific_energy_type,
    psd.location
`,
                [client_id]
            );


            return res.status(200).send({
                success: true,
                message: "Manufacturing process emission fetched successfully",
                data: result.rows
            });

        } catch (error: any) {
            console.error("Manufacturing process emission error:", error);
            return res.status(500).send({
                success: false,
                message: error.message
            });
        }
    });
}

export async function processEnergyEmission(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { client_id } = req.query;

            if (!client_id) {
                return res.status(400).send({
                    success: false,
                    message: "client_id is required"
                });
            }

            const result = await client.query(
                `
                SELECT
                    LOWER(TRIM(SPLIT_PART(pseq.energy_type, '-', 1))) AS energy_source,
                    pseq.process_specific_energy_type,
                    SUM(pseq.quantity_consumed) AS quantity_consumed,

                    CASE
                        WHEN psd.location = 'india'
                            THEN COALESCE(AVG(eef.ef_india_region::numeric), 0)
                        WHEN psd.location = 'europe'
                            THEN COALESCE(AVG(eef.ef_eu_region::numeric), 0)
                        ELSE
                            COALESCE(AVG(eef.ef_global_region::numeric), 0)
                    END AS emission_value,

                    COALESCE(SUM(
                        pseq.quantity_consumed *
                        CASE
                            WHEN psd.location = 'india'
                                THEN COALESCE(eef.ef_india_region::numeric, 0)
                            WHEN psd.location = 'europe'
                                THEN COALESCE(eef.ef_eu_region::numeric, 0)
                            ELSE
                                COALESCE(eef.ef_global_region::numeric, 0)
                        END
                    ), 0) AS total_emission_value

                FROM bom_pcf_request bpr
                JOIN bom b ON b.bom_pcf_id = bpr.id
                JOIN process_specific_energy_usage_questions pseq ON pseq.bom_id = b.id

                LEFT JOIN (
                    SELECT DISTINCT ON (bom_id)
                        bom_id,
                        LOWER(location) AS location,
                        LOWER(detailed_location) AS detailed_location
                    FROM production_site_details_questions
                    ORDER BY bom_id
                ) psd ON psd.bom_id = b.id

                LEFT JOIN electricity_emission_factor eef
                    ON eef.type_of_energy = pseq.energy_type
                    AND eef.unit = pseq.unit
                    AND eef.year = pseq.annual_reporting_period

                WHERE bpr.created_by = $1

                GROUP BY
                    energy_source,
                    pseq.process_specific_energy_type,
                    psd.location
                `,
                [client_id]
            );

            /* 🔥 Transform rows into energy-source based object */
            const groupedData: any = {};

            for (const row of result.rows) {
                const source = row.energy_source;

                if (!groupedData[source]) {
                    groupedData[source] = [];
                }

                groupedData[source].push({
                    process_specific_energy_type: row.process_specific_energy_type,
                    quantity_consumed: row.quantity_consumed,
                    emission_value: row.emission_value,
                    total_emission_value: row.total_emission_value
                });
            }

            return res.status(200).send({
                success: true,
                message: "Process energy emission fetched successfully",
                data: groupedData
            });

        } catch (error: any) {
            console.error("Process energy emission error:", error);
            return res.status(500).send({
                success: false,
                message: error.message
            });
        }
    });
}

export async function getMaterialComposition(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { client_id, supplier_id } = req.query;

            if (!client_id) {
                return res.status(400).send({
                    success: false,
                    message: "client_id is required"
                });
            }

            const result = await client.query(
                //                 `
                //                 WITH material_agg AS (
                //                     SELECT
                //                         bemce.material_type,
                //                         SUM(bemce.material_composition) AS material_composition,
                //                         SUM(bemce.material_emission_factor) AS material_emission_factor,
                //                         SUM(
                //                             bemce.material_composition * bemce.material_emission_factor
                //                         ) AS emission_contribution
                //                     FROM bom_pcf_request bpr
                //                     JOIN bom b
                //                         ON b.bom_pcf_id = bpr.id
                //                     JOIN bom_emission_material_calculation_engine bemce
                //                         ON bemce.bom_id = b.id
                //                     WHERE
                //                         bpr.created_by = $1
                //                         AND ($2::varchar IS NULL OR b.supplier_id = $2::varchar)
                //                     GROUP BY
                //                         bemce.material_type
                //                 )
                //                 SELECT
                //                     material_type,
                //                     material_composition,
                //                     material_emission_factor,
                //                     emission_contribution,
                //                     ROUND(
                //     (
                //         emission_contribution /
                //         SUM(emission_contribution) OVER ()
                //     )::numeric * 100,
                //     2
                // ) AS share_of_total_percentage
                //                 FROM material_agg
                //                 ORDER BY emission_contribution DESC
                //                 `,
                `WITH material_agg AS (
    SELECT
        bemce.material_type,

        /* total composition */
        SUM(bemce.material_composition)::numeric AS material_composition,

        /* total emission factor (as per your rule) */
        SUM(bemce.material_emission_factor)::numeric AS material_emission_factor

    FROM bom_pcf_request bpr
    JOIN bom b
        ON b.bom_pcf_id = bpr.id
    JOIN bom_emission_material_calculation_engine bemce
        ON bemce.bom_id = b.id
    WHERE
        bpr.created_by = $1
        AND ($2::varchar IS NULL OR b.supplier_id = $2::varchar)
    GROUP BY
        bemce.material_type
),
final_calc AS (
    SELECT
        material_type,
        material_composition,
        material_emission_factor,

        /* ✅ THIS IS THE KEY FIX */
        (material_composition * material_emission_factor) AS emission_contribution
    FROM material_agg
)
SELECT
    material_type,
    material_composition,
    material_emission_factor,
    emission_contribution,

    ROUND(
        (emission_contribution / SUM(emission_contribution) OVER ()) * 100,
        2
    ) AS share_of_total_percentage
FROM final_calc
ORDER BY emission_contribution DESC;
`,
                [client_id, supplier_id || null]
            );

            return res.status(200).send({
                success: true,
                message: "Material composition fetched successfully",
                data: result.rows
            });

        } catch (error: any) {
            console.error("Material composition error:", error);
            return res.status(500).send({
                success: false,
                message: error.message
            });
        }
    });
}

export async function getMaterialCarbonIntensity(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { client_id, supplier_id } = req.query;

            if (!client_id) {
                return res.status(400).send({
                    success: false,
                    message: "client_id is required"
                });
            }

            const result = await client.query(
                `WITH material_agg AS (
    SELECT
        bemce.material_type,

        SUM(bemce.material_composition)::numeric AS material_composition,
        SUM(bemce.material_emission_factor)::numeric AS material_emission_factor

    FROM bom_pcf_request bpr
    JOIN bom b
        ON b.bom_pcf_id = bpr.id
    JOIN bom_emission_material_calculation_engine bemce
        ON bemce.bom_id = b.id
    WHERE
        bpr.created_by = $1
        AND ($2::varchar IS NULL OR b.supplier_id = $2::varchar)
    GROUP BY
        bemce.material_type
),
final_calc AS (
    SELECT
        material_type,
        material_composition,
        material_emission_factor,
        (material_composition * material_emission_factor) AS emission_contribution
    FROM material_agg
)
SELECT
    material_type,

    material_emission_factor,          -- added
    emission_contribution,             -- added

    ROUND(
        (emission_contribution / NULLIF(material_composition, 0))::numeric,
        2
    ) AS carbon_intensity

FROM final_calc
ORDER BY material_type;
`,
                [client_id, supplier_id || null]
            );

            return res.status(200).send({
                success: true,
                message: "Material carbon intensity fetched successfully",
                data: {
                    virgin_material: result.rows,
                    recycled_material: []
                }
            });

        } catch (error: any) {
            console.error("Material carbon intensity error:", error);
            return res.status(500).send({
                success: false,
                message: error.message
            });
        }
    });
}

export async function getPercentageShareOfTotalEmission(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { client_id, supplier_id } = req.query;

            if (!client_id) {
                return res.status(400).send({
                    success: false,
                    message: "client_id is required"
                });
            }

            const result = await client.query(
                `
                WITH material_agg AS (
                    SELECT
                        bemce.material_type,
                        SUM(bemce.material_composition)::numeric AS material_composition
                    FROM bom_pcf_request bpr
                    JOIN bom b
                        ON b.bom_pcf_id = bpr.id
                    JOIN bom_emission_material_calculation_engine bemce
                        ON bemce.bom_id = b.id
                    WHERE
                        bpr.created_by = $1
                        AND ($2::varchar IS NULL OR b.supplier_id = $2::varchar)
                    GROUP BY
                        bemce.material_type
                )
                SELECT
                    material_type AS material,
                    ROUND(
                        (material_composition / SUM(material_composition) OVER ()) * 100,
                        2
                    ) AS percentage_share
                FROM material_agg
                ORDER BY percentage_share DESC
                `,
                [client_id, supplier_id || null]
            );

            return res.status(200).send({
                success: true,
                message: "Percentage share of total emission fetched successfully",
                data: result.rows
            });

        } catch (error: any) {
            console.error("Percentage share error:", error);
            return res.status(500).send({
                success: false,
                message: error.message
            });
        }
    });
}

// Transportation emission
export async function getModeOfTransportEmission(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { client_id } = req.query;

            if (!client_id) {
                return res.status(400).send({
                    success: false,
                    message: "client_id is required"
                });
            }

            const result = await client.query(
                `
                WITH transport_agg AS (
                    SELECT
                        belce.mode_of_transport,

                        SUM(belce.distance_km)::numeric AS distance_km,
                        SUM(belce.leg_wise_transport_emissions_per_unit_kg_co2e)::numeric
                            AS co2e_kg

                    FROM bom_pcf_request bpr
                    JOIN bom b
                        ON b.bom_pcf_id = bpr.id
                    JOIN bom_emission_logistic_calculation_engine belce
                        ON belce.bom_id = b.id
                    WHERE
                        bpr.created_by = $1
                    GROUP BY
                        belce.mode_of_transport
                )
                SELECT
                    mode_of_transport,
                    distance_km,
                    co2e_kg,
                    ROUND(
                        (co2e_kg / SUM(co2e_kg) OVER ()) * 100,
                        2
                    ) AS share_percentage
                FROM transport_agg
                ORDER BY share_percentage DESC
                `,
                [client_id]
            );

            return res.status(200).send({
                success: true,
                message: "Mode of transport emission fetched successfully",
                data: result.rows
            });

        } catch (error: any) {
            console.error("Mode of transport emission error:", error);
            return res.status(500).send({
                success: false,
                message: error.message
            });
        }
    });
}

export async function getDistanceVsCorrelationEmission(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { client_id, supplier_id } = req.query;

            if (!client_id) {
                return res.status(400).send({
                    success: false,
                    message: "client_id is required"
                });
            }

            const result = await client.query(
                `
                SELECT
                    belce.mode_of_transport,
                    belce.distance_km,
                    belce.transport_mode_emission_factor_value_kg_co2e_t_km,
                    ROUND(
                        (belce.distance_km * belce.transport_mode_emission_factor_value_kg_co2e_t_km)::numeric,
                        2
                    ) AS total_emission
                FROM bom_pcf_request bpr
                JOIN bom b
                    ON b.bom_pcf_id = bpr.id
                JOIN bom_emission_logistic_calculation_engine belce
                    ON belce.bom_id = b.id
                WHERE
                    bpr.created_by = $1
                    AND ($2::varchar IS NULL OR b.supplier_id = $2::varchar)
                ORDER BY
                    belce.mode_of_transport,
                    belce.distance_km
                `,
                [client_id, supplier_id || null]
            );

            return res.status(200).send({
                success: true,
                message: "Distance vs correlation emission fetched successfully",
                data: result.rows
            });

        } catch (error: any) {
            console.error("Distance vs correlation emission error:", error);
            return res.status(500).send({
                success: false,
                message: error.message
            });
        }
    });
}

// Energy Source 
export async function getEnergySourceEmission(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { client_id } = req.query;

            if (!client_id) {
                return res.status(400).send({
                    success: false,
                    message: "client_id is required"
                });
            }

            /* ---------- ENERGY DATA ---------- */
            const energyResult = await client.query(
                `
                SELECT
                    st.energy_source,
                    st.energy_type,
                    SUM(st.quantity)::numeric AS total_quantity,
                    st.unit,
                    st.annual_reporting_period
                FROM bom_pcf_request bpr
                JOIN supplier_general_info_questions sgiq
                    ON sgiq.bom_pcf_id = bpr.id
                JOIN scope_two_indirect_emissions_questions sw
                    ON sw.sgiq_id = sgiq.sgiq_id
                JOIN scope_two_indirect_emissions_from_purchased_energy_questions st
                    ON st.stide_id = sw.stide_id
                WHERE
                    bpr.created_by = $1
                GROUP BY
                    st.energy_source,
                    st.energy_type,
                    st.unit,
                    st.annual_reporting_period
                `,
                [client_id]
            );

            /* ---------- LOCATION ---------- */
            const locationResult = await client.query(
                `
                SELECT psdq.location
                FROM supplier_general_info_questions sgiq
                JOIN bom_pcf_request bpr
                    ON bpr.id = sgiq.bom_pcf_id
                JOIN supplier_product_questions spq
                    ON spq.sgiq_id = sgiq.sgiq_id
                JOIN production_site_details_questions psdq
                    ON psdq.spq_id = spq.spq_id
                WHERE bpr.created_by = $1
                LIMIT 1
                `,
                [client_id]
            );

            const location =
                locationResult.rows[0]?.location?.toLowerCase() || "global";

            /* ---------- TOTAL QUANTITY (for share %) ---------- */
            const grandTotalQuantity = energyResult.rows.reduce(
                (sum: any, r: any) => sum + Number(r.total_quantity),
                0
            );

            const response: any[] = [];

            /* ---------- PROCESS EACH ENERGY ROW ---------- */
            for (const Energy of energyResult.rows) {
                if (!Energy.energy_source || typeof Energy.energy_source !== "string") {
                    console.warn("Skipping row due to null energy_source:", Energy);
                    continue;
                }
                const sourcePrefix = Energy.energy_source
                    .trim()
                    .split(" ")[0]
                    .toLowerCase();

                const energyType = Energy.energy_type ?? "Unknown";

                let EnergyResponse = "";

                if (sourcePrefix === "electricity") {
                    EnergyResponse = `Electricity - ${energyType}`;
                } else if (sourcePrefix === "heating") {
                    EnergyResponse = `Heating - ${energyType}`;
                } else if (sourcePrefix === "steam") {
                    EnergyResponse = `Steam - ${energyType}`;
                } else if (sourcePrefix === "cooling") {
                    EnergyResponse = `Cooling - ${energyType}`;
                } else {
                    continue;
                }

                /* ---------- FETCH EMISSION FACTOR ---------- */
                const efResult = await client.query(
                    `
                    SELECT
                        ef_india_region,
                        ef_eu_region,
                        ef_global_region
                    FROM electricity_emission_factor
                    WHERE
                        year = $1
                        AND unit = $2
                        AND type_of_energy = $3
                    LIMIT 1
                    `,
                    [
                        Energy.annual_reporting_period,
                        Energy.unit,
                        EnergyResponse
                    ]
                );

                if (efResult.rows.length === 0) continue;

                let emissionFactor = 0;

                if (location === "india") {
                    emissionFactor = Number(efResult.rows[0].ef_india_region);
                } else if (location === "europe") {
                    emissionFactor = Number(efResult.rows[0].ef_eu_region);
                } else {
                    emissionFactor = Number(efResult.rows[0].ef_global_region);
                }

                const totalEmission =
                    Number(Energy.total_quantity) * emissionFactor;

                const sharePercentage =
                    grandTotalQuantity === 0
                        ? 0
                        : Number(
                            (
                                (Energy.total_quantity / grandTotalQuantity) *
                                100
                            ).toFixed(2)
                        );

                response.push({
                    energy_source: EnergyResponse,
                    total_quantity: Energy.total_quantity,
                    unit: Energy.unit,
                    energy_share_percentage: sharePercentage,
                    emission_factor_used: emissionFactor,
                    total_emission: Number(totalEmission.toFixed(2))
                });
            }

            return res.status(200).send({
                success: true,
                message: "Energy source emission fetched successfully",
                data: response
            });

        } catch (error: any) {
            console.error("Energy source emission error:", error);
            return res.status(500).send({
                success: false,
                message: error.message
            });
        }
    });
}

export async function getProcessWiseEnergyConsumption(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { client_id, supplier_id } = req.query;

            if (!client_id) {
                return res.status(400).send({
                    success: false,
                    message: "client_id is required"
                });
            }

            const result = await client.query(
                `
                SELECT
                    COALESCE(SUM(bemce.material_value), 0)::numeric AS material_value,
                    COALESCE(SUM(bemce.production_value), 0)::numeric AS production_value,
                    COALESCE(SUM(bemce.packaging_value), 0)::numeric AS packaging_value,
                    COALESCE(SUM(bemce.logistic_value), 0)::numeric AS logistic_value,
                    COALESCE(SUM(bemce.waste_value), 0)::numeric AS waste_value
                FROM bom_pcf_request bpr
                JOIN bom b
                    ON b.bom_pcf_id = bpr.id
                JOIN bom_emission_calculation_engine bemce
                    ON bemce.bom_id = b.id
                WHERE
                    bpr.created_by = $1
                    AND ($2::varchar IS NULL OR b.supplier_id = $2::varchar)
                `,
                [client_id, supplier_id || null]
            );

            return res.status(200).send({
                success: true,
                message: "Process wise energy consumption fetched successfully",
                data: result.rows[0]   // 🔥 single aggregated row
            });

        } catch (error: any) {
            console.error("Process wise energy consumption error:", error);
            return res.status(500).send({
                success: false,
                message: error.message
            });
        }
    });
}

// Recyclability

export async function getRecyclability(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { client_id, supplier_id } = req.query;

            if (!client_id) {
                return res.status(400).send({
                    success: false,
                    message: "client_id is required"
                });
            }

            const result = await client.query(
                `
WITH material_usage AS (
    SELECT
        bemce.material_type,
        b.id AS bom_id,

        /* 🔥 FIX: cast before SUM */
        SUM(bemce.material_composition_weight::numeric)
            AS total_material_used_in_kg

    FROM bom_pcf_request bpr
    JOIN bom b
        ON b.bom_pcf_id = bpr.id
    JOIN bom_emission_material_calculation_engine bemce
        ON bemce.bom_id = b.id
    WHERE
        bpr.created_by = $1
        AND ($2::varchar IS NULL OR b.supplier_id = $2::varchar)
    GROUP BY
        bemce.material_type,
        b.id
),
recycled_percentage AS (
    SELECT
        rmpq.bom_id,
        rmpq.material_name AS material_type,

        /* 🔥 FIX: cast before SUM */
        SUM(rmpq.percentage::numeric)
            AS total_recycled_material_percentage

    FROM recycled_materials_with_percentage_questions rmpq
    JOIN bom b
        ON b.id = rmpq.bom_id
    JOIN bom_pcf_request bpr
        ON bpr.id = b.bom_pcf_id
    WHERE bpr.created_by = $1
    GROUP BY
        rmpq.bom_id,
        rmpq.material_name
)
SELECT
    mu.material_type,

    SUM(mu.total_material_used_in_kg)
        AS total_material_used_in_kg,

    COALESCE(
        SUM(rp.total_recycled_material_percentage),
        0
    ) AS total_recycled_material_percentage,

    ROUND(
        (
            SUM(mu.total_material_used_in_kg)
            *
            COALESCE(SUM(rp.total_recycled_material_percentage), 0)
        ) / 100,
        2
    ) AS total_recycled_content_used_in_kg

FROM material_usage mu
LEFT JOIN recycled_percentage rp
    ON rp.bom_id = mu.bom_id
    AND rp.material_type = mu.material_type

GROUP BY
    mu.material_type

ORDER BY
    mu.material_type
`,
                [client_id, supplier_id || null]
            );


            return res.status(200).send({
                success: true,
                message: "Recyclability data fetched successfully",
                data: result.rows
            });

        } catch (error: any) {
            console.error("Recyclability error:", error);
            return res.status(500).send({
                success: false,
                message: error.message
            });
        }
    });
}

export async function getVirginOrRecycledEmission(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { client_id, supplier_id } = req.query;

            if (!client_id) {
                return res.status(400).send({
                    success: false,
                    message: "client_id is required"
                });
            }

            const result = await client.query(
                `
                WITH material_agg AS (
                    SELECT
                        bemce.material_type,

                        /* total material % */
                        SUM(bemce.material_composition::numeric)
                            AS total_material_percentage,

                        /* total emission factor */
                        SUM(bemce.material_emission_factor::numeric)
                            AS total_emission_factor

                    FROM bom_pcf_request bpr
                    JOIN bom b
                        ON b.bom_pcf_id = bpr.id
                    JOIN bom_emission_material_calculation_engine bemce
                        ON bemce.bom_id = b.id

                    WHERE
                        bpr.created_by = $1
                        AND ($2::varchar IS NULL OR b.supplier_id = $2::varchar)

                    GROUP BY
                        bemce.material_type
                )
                SELECT
                    material_type,
                    total_material_percentage,
                    total_emission_factor,

                    /* final CO2 emission */
                    ROUND(
                        (total_material_percentage * total_emission_factor),
                        2
                    ) AS total_co2_emission

                FROM material_agg
                ORDER BY total_co2_emission DESC
                `,
                [client_id, supplier_id || null]
            );

            return res.status(200).send({
                success: true,
                message: "Virgin or recycled emission fetched successfully",
                data: result.rows
            });

        } catch (error: any) {
            console.error("Virgin/Recycled emission error:", error);
            return res.status(500).send({
                success: false,
                message: error.message
            });
        }
    });
}

// Waste
export async function getWasteEmissionDetails(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { client_id, supplier_id, waste_type } = req.query;

            if (!client_id) {
                return res.status(400).send({
                    success: false,
                    message: "client_id is required"
                });
            }

            // Parse waste_type filter (comma-separated list)
            const wasteTypeFilter: string[] = (waste_type && typeof waste_type === 'string' && waste_type.trim() !== '')
                ? waste_type.split(',').map((w: string) => w.trim()).filter(Boolean)
                : [];

            /* ---------------------------------------------------
               1️⃣ FETCH WASTE DATA (GROUPED BY TREATMENT TYPE)
            --------------------------------------------------- */
            const queryParams: any[] = [client_id, supplier_id || null];
            let wasteTypeClause = '';
            if (wasteTypeFilter.length > 0) {
                const placeholders = wasteTypeFilter.map((_, i) => `$${i + 3}`).join(', ');
                wasteTypeClause = `AND wpwq.waste_type IN (${placeholders})`;
                queryParams.push(...wasteTypeFilter);
            }

            // Fetch waste data from BOTH paths:
            // 1) Supplier path: wpwq.bom_id → bom → bom_pcf_request
            // 2) Product/Own-emission path: wpwq.product_bom_pcf_id → bom_pcf_request
            const wasteResult = await client.query(
                `
                SELECT
                    wpwq.treatment_type,
                    wpwq.waste_type,
                    wpwq.unit,
                    wpwq.annual_reporting_period,
                    wpwq.stoie_id,
                    SUM(wpwq.waste_weight::numeric) AS total_waste_weight
                FROM weight_of_pro_packaging_waste_questions wpwq
                LEFT JOIN bom b ON wpwq.bom_id = b.id
                LEFT JOIN bom_pcf_request bpr_bom ON b.bom_pcf_id = bpr_bom.id
                LEFT JOIN bom_pcf_request bpr_prod ON wpwq.product_bom_pcf_id = bpr_prod.id
                WHERE
                    (bpr_bom.created_by = $1 OR bpr_prod.created_by = $1)
                    AND ($2::varchar IS NULL OR b.supplier_id = $2::varchar)
                    ${wasteTypeClause}
                GROUP BY
                    wpwq.treatment_type,
                    wpwq.waste_type,
                    wpwq.unit,
                    wpwq.annual_reporting_period,
                    wpwq.stoie_id
                `,
                queryParams
            );

            /* ---------------------------------------------------
               2️⃣ FETCH LOCATION (ONCE)
            --------------------------------------------------- */
            const locationResult = await client.query(
                `
                SELECT psdq.location
                FROM scope_three_other_indirect_emissions_questions stoie
                JOIN supplier_general_info_questions sgiq
                    ON sgiq.sgiq_id = stoie.sgiq_id
                JOIN bom_pcf_request bpr
                    ON bpr.id = sgiq.bom_pcf_id
                JOIN supplier_product_questions spq
                    ON spq.sgiq_id = stoie.sgiq_id
                JOIN production_site_details_questions psdq
                    ON psdq.spq_id = spq.spq_id
                WHERE bpr.created_by = $1
                LIMIT 1
                `,
                [client_id]
            );

            const location =
                locationResult.rows[0]?.location?.toLowerCase() || "global";

            /* ---------------------------------------------------
           3️⃣ AGGREGATE BY TREATMENT TYPE
        --------------------------------------------------- */

            const treatmentMap: any = {};
            let totalWasteGenerated = 0;
            let totalEmissionGenerated = 0;

            for (const row of wasteResult.rows) {

                const treatmentTypeTrimmed = (row.treatment_type || '').replace(/\s+/g, ' ').trim();

                // 1️⃣ Try packaging emission factor table (flexible: ignore unit/year mismatch)
                let efResult = await client.query(
                    `
        SELECT
            pmttef.ef_india_region,
            pmttef.ef_eu_region,
            pmttef.ef_global_region
        FROM packaging_material_treatment_type_emission_factor pmttef
        JOIN packaging_treatment_type ptt
            ON pmttef.ptt_id = ptt.ptt_id
        WHERE
            LOWER(TRIM(pmttef.material_type)) = LOWER(TRIM($1))
            AND LOWER(TRIM(REGEXP_REPLACE(ptt.name, '\\s+', ' ', 'g'))) = LOWER(TRIM($2))
        ORDER BY
            CASE WHEN pmttef.year = $3 THEN 0 ELSE 1 END,
            pmttef.year DESC
        LIMIT 1
        `,
                    [
                        row.waste_type,
                        treatmentTypeTrimmed,
                        row.annual_reporting_period || '2025'
                    ]
                );

                // 2️⃣ Fallback: try waste emission factor table
                if (!efResult.rows.length) {
                    efResult = await client.query(
                        `
        SELECT
            wmttef.ef_india_region,
            wmttef.ef_eu_region,
            wmttef.ef_global_region
        FROM waste_material_treatment_type_emission_factor wmttef
        JOIN waste_treatment_type wtt
            ON wmttef.wtt_id = wtt.wtt_id
        WHERE
            LOWER(TRIM(wmttef.waste_type)) = LOWER(TRIM($1))
            AND LOWER(TRIM(REGEXP_REPLACE(wtt.name, '\\s+', ' ', 'g'))) = LOWER(TRIM($2))
        ORDER BY
            CASE WHEN wmttef.year = $3 THEN 0 ELSE 1 END,
            wmttef.year DESC
        LIMIT 1
        `,
                        [
                            row.waste_type,
                            treatmentTypeTrimmed,
                            row.annual_reporting_period || '2025'
                        ]
                    );
                }

                let emissionFactor = 0;
                if (efResult.rows.length) {
                    if (location === "india") {
                        emissionFactor = Number(efResult.rows[0].ef_india_region) || 0;
                    } else if (location === "europe") {
                        emissionFactor = Number(efResult.rows[0].ef_eu_region) || 0;
                    } else {
                        emissionFactor = Number(efResult.rows[0].ef_global_region) || 0;
                    }
                }

                // Convert waste weight to kg if needed
                let wasteWeight = Number(row.total_waste_weight);
                const unitLower = (row.unit || '').toLowerCase();
                if (unitLower.includes('metric ton') || unitLower.includes('mt') || unitLower.includes('tonne')) {
                    wasteWeight = wasteWeight * 1000; // Convert MT to kg
                } else if (unitLower.includes('gram') && !unitLower.includes('kilo')) {
                    wasteWeight = wasteWeight / 1000; // Convert g to kg
                }
                const emission = wasteWeight * emissionFactor;

                /* 🔁 GROUP BY TREATMENT TYPE */
                if (!treatmentMap[row.treatment_type]) {
                    treatmentMap[row.treatment_type] = {
                        treatment_type: row.treatment_type,
                        total_waste_weight: 0,
                        unit: row.unit,
                        total_co2_emission: 0
                    };
                }

                treatmentMap[row.treatment_type].total_waste_weight += wasteWeight;
                treatmentMap[row.treatment_type].total_co2_emission += emission;

                /* 🔢 GRAND TOTALS */
                totalWasteGenerated += wasteWeight;
                totalEmissionGenerated += emission;
            }


            const finalData = Object.values(treatmentMap).map((item: any) => ({
                ...item,
                total_waste_weight: Number(item.total_waste_weight.toFixed(4)),
                total_co2_emission: Number(item.total_co2_emission.toFixed(4))
            }));

            return res.status(200).send({
                success: true,
                message: "Waste emission details fetched successfully",
                data: finalData,
                totals: {
                    total_waste_generated_kg: Number(totalWasteGenerated.toFixed(2)),
                    total_emission_generated_kg_co2e: Number(totalEmissionGenerated.toFixed(2))
                }
            });


        } catch (error: any) {
            console.error("Waste emission details error:", error);
            return res.status(500).send({
                success: false,
                message: error.message
            });
        }
    });
}

// Waste type dropdown for dashboard filter
export async function getWasteTypeDropdown(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { client_id } = req.query;

            if (!client_id) {
                return res.status(400).send({
                    success: false,
                    message: "client_id is required"
                });
            }

            const result = await client.query(
                `
                SELECT DISTINCT wpwq.waste_type
                FROM weight_of_pro_packaging_waste_questions wpwq
                LEFT JOIN bom b ON wpwq.bom_id = b.id
                LEFT JOIN bom_pcf_request bpr_bom ON b.bom_pcf_id = bpr_bom.id
                LEFT JOIN bom_pcf_request bpr_prod ON wpwq.product_bom_pcf_id = bpr_prod.id
                WHERE (bpr_bom.created_by = $1 OR bpr_prod.created_by = $1)
                    AND wpwq.waste_type IS NOT NULL
                    AND wpwq.waste_type != ''
                ORDER BY wpwq.waste_type ASC
                `,
                [client_id]
            );

            return res.status(200).send({
                success: true,
                message: "Waste type dropdown fetched successfully",
                data: result.rows.map((r: any) => r.waste_type)
            });

        } catch (error: any) {
            console.error("Waste type dropdown error:", error);
            return res.status(500).send({
                success: false,
                message: error.message
            });
        }
    });
}

// PCF Visualisation Trends
export async function getPcfReductionGraph(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { client_id, supplier_id } = req.query;

            if (!client_id) {
                return res.status(400).send({
                    success: false,
                    message: "client_id is required"
                });
            }

            /* ---------------------------------------------------
               1️⃣ FETCH YEARLY PCF (NO DUPLICATES)
            --------------------------------------------------- */
            const result = await client.query(
                `
                SELECT
                    sgiq.annual_reporting_period AS year,
                    bpr.product_code,
                    p.product_name,
                    SUM(bpr.overall_pcf::numeric) AS total_emission
                FROM bom_pcf_request bpr
                JOIN supplier_general_info_questions sgiq
                    ON bpr.id = sgiq.bom_pcf_id
                JOIN product p
                    ON p.product_code = bpr.product_code
                WHERE
                    bpr.created_by = $1
                    AND ($2::varchar IS NULL OR sgiq.sup_id = $2::varchar)
                GROUP BY
                    sgiq.annual_reporting_period,
                    bpr.product_code,
                    p.product_name
                ORDER BY
                    p.product_name,
                    sgiq.annual_reporting_period
                `,
                [client_id, supplier_id || null]
            );

            /* ---------------------------------------------------
               2️⃣ CALCULATE % REDUCTION FROM PREVIOUS YEAR
            --------------------------------------------------- */
            const finalData: any[] = [];
            const productYearMap: any = {};

            for (const row of result.rows) {
                const key = row.product_code;

                if (!productYearMap[key]) {
                    productYearMap[key] = [];
                }

                productYearMap[key].push({
                    year: Number(row.year),
                    product_name: row.product_name,
                    total_emission: Number(row.total_emission)
                });
            }

            for (const productCode in productYearMap) {
                const records = productYearMap[productCode];

                records.sort((a: any, b: any) => a.year - b.year);

                for (let i = 0; i < records.length; i++) {
                    const current = records[i];
                    const previous = records[i - 1];

                    let reductionPercentage = null;

                    if (previous) {
                        reductionPercentage =
                            ((previous.total_emission - current.total_emission) /
                                previous.total_emission) *
                            100;
                    }

                    finalData.push({
                        year: current.year,
                        product_name: current.product_name,
                        total_emission_kg_co2_eq: Number(
                            current.total_emission.toFixed(2)
                        ),
                        reduction_from_previous_period_percentage:
                            reductionPercentage !== null
                                ? Number(reductionPercentage.toFixed(2))
                                : null
                    });
                }
            }

            return res.status(200).send({
                success: true,
                message: "PCF reduction graph data fetched successfully",
                data: finalData
            });

        } catch (error: any) {
            console.error("PCF reduction graph error:", error);
            return res.status(500).send({
                success: false,
                message: error.message
            });
        }
    });
}

export async function getActualPcfEmission(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { client_id, supplier_id } = req.query;

            if (!client_id) {
                return res.status(400).send({
                    success: false,
                    message: "client_id is required"
                });
            }

            /* ---------------------------------------------------
               FETCH ACTUAL PCF EMISSION (PRODUCT LEVEL)
            --------------------------------------------------- */
            const result = await client.query(
                `
                SELECT
                    p.product_name,
                    SUM(bpr.overall_pcf::numeric) AS total_overall_pcf_emission
                FROM bom_pcf_request bpr
                JOIN product p
                    ON p.product_code = bpr.product_code
                LEFT JOIN supplier_general_info_questions sgiq
                    ON sgiq.bom_pcf_id = bpr.id
                WHERE
                    bpr.created_by = $1
                    AND ($2::varchar IS NULL OR sgiq.sup_id = $2::varchar)
                GROUP BY
                    p.product_name
                ORDER BY
                    p.product_name
                `,
                [client_id, supplier_id || null]
            );

            return res.status(200).send({
                success: true,
                message: "Actual PCF emission fetched successfully",
                data: result.rows.map((row: any) => ({
                    product_name: row.product_name,
                    total_overall_pcf_emission: Number(
                        Number(row.total_overall_pcf_emission || 0).toFixed(2)
                    )
                }))
            });

        } catch (error: any) {
            console.error("Actual PCF emission error:", error);
            return res.status(500).send({
                success: false,
                message: error.message
            });
        }
    });
}

export async function getForecastedEmission(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { client_id, supplier_id } = req.query;

            if (!client_id) {
                return res.status(400).send({
                    success: false,
                    message: "client_id is required"
                });
            }

            /* ---------------------------------------------------
               FETCH FORECASTED EMISSION (YEAR LEVEL)
            --------------------------------------------------- */
            const result = await client.query(
                `
                SELECT
                    sgiq.annual_reporting_period AS year,
                    SUM(bpr.overall_pcf::numeric) AS total_forecasted_emission
                FROM bom_pcf_request bpr
                JOIN supplier_general_info_questions sgiq
                    ON sgiq.bom_pcf_id = bpr.id
                WHERE
                    bpr.created_by = $1
                    AND ($2::varchar IS NULL OR sgiq.sup_id = $2::varchar)
                GROUP BY
                    sgiq.annual_reporting_period
                ORDER BY
                    sgiq.annual_reporting_period
                `,
                [client_id, supplier_id || null]
            );

            return res.status(200).send({
                success: true,
                message: "Forecasted emission fetched successfully",
                data: result.rows.map((row: any) => ({
                    year: Number(row.year),
                    total_forecasted_emission_kg_co2_eq: Number(
                        Number(row.total_forecasted_emission || 0).toFixed(2)
                    )
                }))
            });

        } catch (error: any) {
            console.error("Forecasted emission error:", error);
            return res.status(500).send({
                success: false,
                message: error.message
            });
        }
    });
}

// Impact Categories
export async function getImpactCategories(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { client_id } = req.query;

            if (!client_id) {
                return res.status(400).send({
                    success: false,
                    message: "client_id is required"
                });
            }

            // Aggregate emission values by lifecycle stage
            const aggregateResult = await client.query(`
                SELECT
                    COALESCE(SUM(be.material_value), 0) AS raw_material,
                    COALESCE(SUM(be.production_value), 0) AS manufacturing,
                    COALESCE(SUM(be.packaging_value), 0) AS packaging,
                    COALESCE(SUM(be.logistic_value), 0) AS transportation,
                    COALESCE(SUM(be.waste_value), 0) AS waste
                FROM bom_pcf_request bpr
                JOIN bom b ON b.bom_pcf_id = bpr.id
                JOIN bom_emission_calculation_engine be ON be.bom_id = b.id
                WHERE bpr.created_by = $1
            `, [client_id]);

            const agg = aggregateResult.rows[0];

            const indicators = [
                { name: "Global Warming (GWP)", value: Number(Number(agg.raw_material || 0).toFixed(2)), unit: "kg CO₂ eq" },
                { name: "Ozone Depletion (ODP)", value: Number(Number(agg.manufacturing || 0).toFixed(4)), unit: "kg CFC-11 eq" },
                { name: "Acidification (AP)", value: Number(Number(agg.packaging || 0).toFixed(2)), unit: "kg SO₂ eq" },
                { name: "Eutrophication (EP)", value: Number(Number(agg.transportation || 0).toFixed(2)), unit: "kg PO₄ eq" },
                { name: "Photochemical Ozone (POCP)", value: Number(Number(agg.waste || 0).toFixed(2)), unit: "kg NMVOC eq" },
            ];

            // Per-product comparison
            const productResult = await client.query(`
                SELECT
                    p.product_name,
                    COALESCE(SUM(be.material_value), 0) AS gwp,
                    COALESCE(SUM(be.production_value), 0) AS odp,
                    COALESCE(SUM(be.packaging_value), 0) AS ap,
                    COALESCE(SUM(be.logistic_value), 0) AS ep,
                    COALESCE(SUM(be.waste_value), 0) AS pocp
                FROM bom_pcf_request bpr
                JOIN bom b ON b.bom_pcf_id = bpr.id
                JOIN bom_emission_calculation_engine be ON be.bom_id = b.id
                JOIN product p ON p.product_code = bpr.product_code
                WHERE bpr.created_by = $1
                GROUP BY p.product_name
                ORDER BY p.product_name
            `, [client_id]);

            const productComparison = productResult.rows.map((row: any) => ({
                name: row.product_name,
                gwp: Number(Number(row.gwp || 0).toFixed(2)),
                odp: Number(Number(row.odp || 0).toFixed(2)),
                ap: Number(Number(row.ap || 0).toFixed(2)),
                ep: Number(Number(row.ep || 0).toFixed(2)),
                pocp: Number(Number(row.pocp || 0).toFixed(2)),
            }));

            return res.status(200).send({
                success: true,
                message: "Impact categories fetched successfully",
                data: {
                    indicators,
                    productComparison
                }
            });

        } catch (error: any) {
            console.error("Impact categories error:", error);
            return res.status(500).send({
                success: false,
                message: error.message
            });
        }
    });
}

// Dashboard summary KPI cards (Total CO2e, Manufacturing, Recyclability, Transport)
export async function getSummaryKpis(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { user_id } = req.query;

            if (!user_id) {
                return res.status(400).send({
                    success: false,
                    message: "user_id is required"
                });
            }

            const lifecycleResult = await client.query(`
                SELECT
                    COALESCE(SUM(be.material_value), 0)    AS raw_material,
                    COALESCE(SUM(be.production_value), 0)  AS manufacturing,
                    COALESCE(SUM(be.packaging_value), 0)   AS packaging,
                    COALESCE(SUM(be.logistic_value), 0)    AS transport,
                    COALESCE(SUM(be.waste_value), 0)       AS waste
                FROM bom_pcf_request bpr
                JOIN bom b
                    ON b.bom_pcf_id = bpr.id
                JOIN bom_emission_calculation_engine be
                    ON be.bom_id = b.id
                WHERE bpr.created_by = $1
            `, [user_id]);

            const row = lifecycleResult.rows[0] || {};
            const rawMaterial    = Number(row.raw_material)   || 0;
            const manufacturing  = Number(row.manufacturing)  || 0;
            const packaging      = Number(row.packaging)      || 0;
            const transport      = Number(row.transport)      || 0;
            const waste          = Number(row.waste)          || 0;
            const total          = rawMaterial + manufacturing + packaging + transport + waste;

            const recyclabilityResult = await client.query(`
                WITH material_usage AS (
                    SELECT
                        b.id AS bom_id,
                        bemce.material_type,
                        SUM(bemce.material_composition_weight::numeric) AS total_material_used_in_kg
                    FROM bom_pcf_request bpr
                    JOIN bom b ON b.bom_pcf_id = bpr.id
                    JOIN bom_emission_material_calculation_engine bemce ON bemce.bom_id = b.id
                    WHERE bpr.created_by = $1
                    GROUP BY b.id, bemce.material_type
                ),
                recycled_percentage AS (
                    SELECT
                        rmpq.bom_id,
                        rmpq.material_name AS material_type,
                        SUM(rmpq.percentage::numeric) AS total_recycled_material_percentage
                    FROM recycled_materials_with_percentage_questions rmpq
                    JOIN bom b ON b.id = rmpq.bom_id
                    JOIN bom_pcf_request bpr ON bpr.id = b.bom_pcf_id
                    WHERE bpr.created_by = $1
                    GROUP BY rmpq.bom_id, rmpq.material_name
                )
                SELECT
                    COALESCE(SUM(mu.total_material_used_in_kg), 0) AS total_material,
                    COALESCE(SUM(
                        (mu.total_material_used_in_kg
                         * COALESCE(rp.total_recycled_material_percentage, 0)) / 100
                    ), 0) AS total_recycled
                FROM material_usage mu
                LEFT JOIN recycled_percentage rp
                    ON rp.bom_id = mu.bom_id
                    AND rp.material_type = mu.material_type
            `, [user_id]);

            const rec = recyclabilityResult.rows[0] || {};
            const totalMaterial   = Number(rec.total_material)   || 0;
            const totalRecycled   = Number(rec.total_recycled)   || 0;
            const recyclabilityRate = totalMaterial > 0
                ? Number(((totalRecycled / totalMaterial) * 100).toFixed(2))
                : 0;

            const percentOfTotal = (value: number) =>
                total > 0 ? Number(((value / total) * 100).toFixed(2)) : 0;

            return res.status(200).send({
                success: true,
                message: "Summary KPIs fetched successfully",
                data: {
                    totalFootprint:         Number(total.toFixed(2)),
                    manufacturingEmission:  Number(manufacturing.toFixed(2)),
                    transportEmission:      Number(transport.toFixed(2)),
                    recyclabilityRate,
                    manufacturingPercent:   percentOfTotal(manufacturing),
                    transportPercent:       percentOfTotal(transport)
                }
            });

        } catch (error: any) {
            console.error("Summary KPIs error:", error);
            return res.status(500).send({
                success: false,
                message: error.message
            });
        }
    });
}

// ============================================================
// SUPER ADMIN DASHBOARD ENDPOINTS
// ============================================================

// Platform-wide stats: client/supplier counts + PCF request status counts
export async function getPlatformStats(_req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const clientsResult = await client.query(`
                SELECT COUNT(*)::int AS total
                FROM users_table
                WHERE LOWER(user_role) = 'client'
            `);

            const suppliersResult = await client.query(`
                SELECT COUNT(*)::int AS total
                FROM supplier_details
            `);

            const requestsResult = await client.query(`
                SELECT
                    COUNT(*)::int AS total,
                    COUNT(*) FILTER (WHERE is_approved = true)::int AS completed,
                    COUNT(*) FILTER (
                        WHERE is_approved = false
                          AND is_rejected = false
                          AND is_draft    = false
                    )::int AS in_progress,
                    COUNT(*) FILTER (WHERE is_draft = true)::int AS draft,
                    COUNT(*) FILTER (WHERE is_rejected = true)::int AS rejected
                FROM bom_pcf_request
            `);

            const r = requestsResult.rows[0] || {};

            const activeClientsResult = await client.query(`
                SELECT COUNT(DISTINCT u.user_id)::int AS active
                FROM users_table u
                JOIN bom_pcf_request bpr
                    ON bpr.created_by = u.user_id
                WHERE LOWER(u.user_role) = 'client'
                  AND bpr.is_rejected = false
            `);

            return res.status(200).send({
                success: true,
                message: "Platform stats fetched successfully",
                data: {
                    totalClients:   Number(clientsResult.rows[0]?.total)   || 0,
                    totalSuppliers: Number(suppliersResult.rows[0]?.total) || 0,
                    activeClients:  Number(activeClientsResult.rows[0]?.active) || 0,
                    totalRequests:     Number(r.total)       || 0,
                    completedRequests: Number(r.completed)   || 0,
                    inProgressRequests: Number(r.in_progress) || 0,
                    draftRequests:     Number(r.draft)       || 0,
                    rejectedRequests:  Number(r.rejected)    || 0,
                    pendingApprovals:  Number(r.in_progress) || 0
                }
            });

        } catch (error: any) {
            console.error("Platform stats error:", error);
            return res.status(500).send({
                success: false,
                message: error.message
            });
        }
    });
}

// Client status distribution (Active / Pending / Inactive)
export async function getClientStatusDistribution(_req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const result = await client.query(`
                WITH client_list AS (
                    SELECT user_id
                    FROM users_table
                    WHERE LOWER(user_role) = 'client'
                ),
                client_requests AS (
                    SELECT
                        cl.user_id,
                        COUNT(bpr.id)::int AS total_requests,
                        COUNT(bpr.id) FILTER (WHERE bpr.is_rejected = false)::int AS active_requests
                    FROM client_list cl
                    LEFT JOIN bom_pcf_request bpr ON bpr.created_by = cl.user_id
                    GROUP BY cl.user_id
                )
                SELECT
                    COUNT(*) FILTER (WHERE active_requests > 0)::int    AS active,
                    COUNT(*) FILTER (WHERE total_requests  = 0)::int    AS pending,
                    COUNT(*) FILTER (
                        WHERE total_requests > 0 AND active_requests = 0
                    )::int AS inactive
                FROM client_requests
            `);

            const row = result.rows[0] || {};
            return res.status(200).send({
                success: true,
                message: "Client status distribution fetched successfully",
                data: {
                    active:   Number(row.active)   || 0,
                    pending:  Number(row.pending)  || 0,
                    inactive: Number(row.inactive) || 0
                }
            });

        } catch (error: any) {
            console.error("Client status distribution error:", error);
            return res.status(500).send({
                success: false,
                message: error.message
            });
        }
    });
}

// Request status distribution (Completed / In Progress / Pending / Rejected)
export async function getRequestStatusDistribution(_req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const result = await client.query(`
                SELECT
                    COUNT(*) FILTER (WHERE is_approved = true)::int AS completed,
                    COUNT(*) FILTER (
                        WHERE is_approved = false
                          AND is_rejected = false
                          AND is_draft    = false
                    )::int AS in_progress,
                    COUNT(*) FILTER (WHERE is_draft    = true)::int AS pending,
                    COUNT(*) FILTER (WHERE is_rejected = true)::int AS rejected
                FROM bom_pcf_request
            `);

            const row = result.rows[0] || {};
            return res.status(200).send({
                success: true,
                message: "Request status distribution fetched successfully",
                data: {
                    completed:  Number(row.completed)   || 0,
                    inProgress: Number(row.in_progress) || 0,
                    pending:    Number(row.pending)     || 0,
                    rejected:   Number(row.rejected)    || 0
                }
            });

        } catch (error: any) {
            console.error("Request status distribution error:", error);
            return res.status(500).send({
                success: false,
                message: error.message
            });
        }
    });
}

// Top 5 emitting clients
export async function getTopEmitters(_req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const result = await client.query(`
                SELECT
                    u.user_id,
                    u.user_name,
                    COALESCE(SUM(
                        be.material_value
                      + be.production_value
                      + be.packaging_value
                      + be.logistic_value
                      + be.waste_value
                    ), 0)::numeric AS total_emission
                FROM users_table u
                LEFT JOIN bom_pcf_request bpr
                    ON bpr.created_by = u.user_id
                LEFT JOIN bom b
                    ON b.bom_pcf_id = bpr.id
                LEFT JOIN bom_emission_calculation_engine be
                    ON be.bom_id = b.id
                WHERE LOWER(u.user_role) = 'client'
                GROUP BY u.user_id, u.user_name
                HAVING COALESCE(SUM(
                    be.material_value
                  + be.production_value
                  + be.packaging_value
                  + be.logistic_value
                  + be.waste_value
                ), 0) > 0
                ORDER BY total_emission DESC
                LIMIT 5
            `);

            const data = result.rows.map((row: any) => ({
                name:     row.user_name,
                emission: Number(Number(row.total_emission).toFixed(2))
            }));

            return res.status(200).send({
                success: true,
                message: "Top emitters fetched successfully",
                data
            });

        } catch (error: any) {
            console.error("Top emitters error:", error);
            return res.status(500).send({
                success: false,
                message: error.message
            });
        }
    });
}

// Recent platform activity feed (last 10 actions)
export async function getRecentActivities(_req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const result = await client.query(`
                SELECT
                    bpr.id,
                    bpr.code,
                    bpr.request_title,
                    bpr.status,
                    bpr.is_approved,
                    bpr.is_rejected,
                    bpr.is_draft,
                    bpr.created_date,
                    bpr.update_date,
                    u.user_name AS creator_name,
                    cu.user_name AS client_name
                FROM bom_pcf_request bpr
                LEFT JOIN users_table u  ON u.user_id  = bpr.created_by
                LEFT JOIN users_table cu ON cu.user_id = bpr.client_id
                ORDER BY COALESCE(bpr.update_date, bpr.created_date) DESC
                LIMIT 10
            `);

            const data = result.rows.map((row: any) => {
                let action = "created PCF request";
                if (row.is_approved)      action = "approved PCF request";
                else if (row.is_rejected) action = "rejected PCF request";
                else if (row.is_draft)    action = "drafted PCF request";
                else if (row.status && String(row.status).toLowerCase().includes("progress"))
                    action = "is working on PCF request";

                return {
                    id:        row.id,
                    actor:     row.creator_name || "Unknown",
                    action,
                    target:    row.request_title || row.code || "",
                    client:    row.client_name || "",
                    timestamp: row.update_date || row.created_date
                };
            });

            return res.status(200).send({
                success: true,
                message: "Recent activities fetched successfully",
                data
            });

        } catch (error: any) {
            console.error("Recent activities error:", error);
            return res.status(500).send({
                success: false,
                message: error.message
            });
        }
    });
}

// ============================================================
// CLIENT DASHBOARD ENDPOINTS
// ============================================================

// Per-product emission summary for the logged-in client
export async function getProductEmissions(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { user_id } = req.query;
            if (!user_id) {
                return res.status(400).send({
                    success: false,
                    message: "user_id is required"
                });
            }

            const result = await client.query(`
                SELECT
                    bpr.id,
                    bpr.code,
                    COALESCE(bpr.request_title, bpr.product_code, bpr.code) AS product_name,
                    COALESCE(SUM(
                        be.material_value
                      + be.production_value
                      + be.packaging_value
                      + be.logistic_value
                      + be.waste_value
                    ), 0)::numeric AS total_emission
                FROM bom_pcf_request bpr
                LEFT JOIN bom b
                    ON b.bom_pcf_id = bpr.id
                LEFT JOIN bom_emission_calculation_engine be
                    ON be.bom_id = b.id
                WHERE bpr.created_by = $1
                GROUP BY bpr.id, bpr.code, bpr.request_title, bpr.product_code
                ORDER BY total_emission DESC
                LIMIT 10
            `, [user_id]);

            const data = result.rows.map((row: any) => ({
                name:     row.product_name,
                emission: Number(Number(row.total_emission).toFixed(2))
            }));

            return res.status(200).send({
                success: true,
                message: "Product emissions fetched successfully",
                data
            });

        } catch (error: any) {
            console.error("Product emissions error:", error);
            return res.status(500).send({
                success: false,
                message: error.message
            });
        }
    });
}

// Monthly emission trend for the logged-in client (last 12 months)
export async function getMonthlyEmissionTrend(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { user_id } = req.query;
            if (!user_id) {
                return res.status(400).send({
                    success: false,
                    message: "user_id is required"
                });
            }

            const result = await client.query(`
                SELECT
                    TO_CHAR(date_trunc('month', bpr.created_date), 'Mon YYYY') AS month_label,
                    date_trunc('month', bpr.created_date) AS month_start,
                    COALESCE(SUM(
                        be.material_value
                      + be.production_value
                      + be.packaging_value
                      + be.logistic_value
                      + be.waste_value
                    ), 0)::numeric AS total_emission
                FROM bom_pcf_request bpr
                LEFT JOIN bom b
                    ON b.bom_pcf_id = bpr.id
                LEFT JOIN bom_emission_calculation_engine be
                    ON be.bom_id = b.id
                WHERE bpr.created_by = $1
                  AND bpr.created_date >= (CURRENT_DATE - INTERVAL '12 months')
                GROUP BY date_trunc('month', bpr.created_date)
                ORDER BY month_start ASC
            `, [user_id]);

            const data = result.rows.map((row: any) => ({
                month:    row.month_label,
                emission: Number(Number(row.total_emission).toFixed(2))
            }));

            return res.status(200).send({
                success: true,
                message: "Monthly emission trend fetched successfully",
                data
            });

        } catch (error: any) {
            console.error("Monthly emission trend error:", error);
            return res.status(500).send({
                success: false,
                message: error.message
            });
        }
    });
}

// Scope 1 / 2 / 3 breakdown (approximated from bom_emission_calculation_engine)
//   Scope 1 (direct):            production_value
//   Scope 2 (indirect purchased): logistic_value
//   Scope 3 (value chain):       material_value + packaging_value + waste_value
export async function getScopeBreakdown(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { user_id } = req.query;
            if (!user_id) {
                return res.status(400).send({
                    success: false,
                    message: "user_id is required"
                });
            }

            const result = await client.query(`
                SELECT
                    COALESCE(SUM(be.production_value), 0)::numeric AS scope_one,
                    COALESCE(SUM(be.logistic_value),   0)::numeric AS scope_two,
                    COALESCE(SUM(
                        be.material_value + be.packaging_value + be.waste_value
                    ), 0)::numeric AS scope_three
                FROM bom_pcf_request bpr
                JOIN bom b                                ON b.bom_pcf_id = bpr.id
                JOIN bom_emission_calculation_engine be   ON be.bom_id    = b.id
                WHERE bpr.created_by = $1
            `, [user_id]);

            const row = result.rows[0] || {};
            const scopeOne   = Number(row.scope_one)   || 0;
            const scopeTwo   = Number(row.scope_two)   || 0;
            const scopeThree = Number(row.scope_three) || 0;
            const total      = scopeOne + scopeTwo + scopeThree;

            const pct = (v: number) => total > 0 ? Number(((v / total) * 100).toFixed(2)) : 0;

            return res.status(200).send({
                success: true,
                message: "Scope breakdown fetched successfully",
                data: {
                    scopeOne:          Number(scopeOne.toFixed(2)),
                    scopeTwo:          Number(scopeTwo.toFixed(2)),
                    scopeThree:        Number(scopeThree.toFixed(2)),
                    total:             Number(total.toFixed(2)),
                    scopeOnePercent:   pct(scopeOne),
                    scopeTwoPercent:   pct(scopeTwo),
                    scopeThreePercent: pct(scopeThree)
                }
            });

        } catch (error: any) {
            console.error("Scope breakdown error:", error);
            return res.status(500).send({
                success: false,
                message: error.message
            });
        }
    });
}

// Packaging emission detail (sum + packaging-type breakdown)
export async function getPackagingEmissionDetails(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { user_id } = req.query;
            if (!user_id) {
                return res.status(400).send({
                    success: false,
                    message: "user_id is required"
                });
            }

            const totalResult = await client.query(`
                SELECT COALESCE(SUM(be.packaging_value), 0)::numeric AS total_packaging
                FROM bom_pcf_request bpr
                JOIN bom b                               ON b.bom_pcf_id = bpr.id
                JOIN bom_emission_calculation_engine be  ON be.bom_id    = b.id
                WHERE bpr.created_by = $1
            `, [user_id]);

            const breakdownResult = await client.query(`
                SELECT
                    COALESCE(pk.packaging_type, 'Other') AS packaging_type,
                    COALESCE(SUM(
                        COALESCE(pk.pack_weight_kg, 0)
                        * COALESCE(pk.emission_factor_box_kg, 0)
                    ), 0)::numeric AS emission
                FROM bom_pcf_request bpr
                JOIN bom b                                   ON b.bom_pcf_id = bpr.id
                JOIN bom_emission_packaging_calculation_engine pk
                    ON pk.bom_id = b.id
                WHERE bpr.created_by = $1
                GROUP BY pk.packaging_type
                HAVING COALESCE(SUM(
                    COALESCE(pk.pack_weight_kg, 0)
                    * COALESCE(pk.emission_factor_box_kg, 0)
                ), 0) > 0
                ORDER BY emission DESC
            `, [user_id]);

            return res.status(200).send({
                success: true,
                message: "Packaging emission details fetched successfully",
                data: {
                    totalPackaging: Number(Number(totalResult.rows[0]?.total_packaging ?? 0).toFixed(2)),
                    breakdown: breakdownResult.rows.map((row: any) => ({
                        materialType: row.packaging_type,
                        emission:     Number(Number(row.emission).toFixed(2))
                    }))
                }
            });

        } catch (error: any) {
            console.error("Packaging emission details error:", error);
            return res.status(500).send({
                success: false,
                message: error.message
            });
        }
    });
}

// ============================================================
// CLIENT DASHBOARD — PHASE A ENDPOINTS (logged-in client view)
// ============================================================

// Client dashboard KPI cards: total products, active suppliers, avg carbon footprint, recyclability rate
export async function getClientKpis(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { user_id } = req.query;
            if (!user_id) {
                return res.status(400).send({
                    success: false,
                    message: "user_id is required"
                });
            }

            const productsResult = await client.query(`
                SELECT COUNT(*)::int AS total
                FROM product
                WHERE created_by = $1
            `, [user_id]);

            const suppliersResult = await client.query(`
                SELECT COUNT(DISTINCT b.supplier_id)::int AS active
                FROM bom_pcf_request bpr
                JOIN bom b ON b.bom_pcf_id = bpr.id
                WHERE bpr.created_by = $1
                  AND b.supplier_id IS NOT NULL
                  AND b.supplier_id != ''
            `, [user_id]);

            const emissionsResult = await client.query(`
                SELECT
                    COALESCE(SUM(
                        be.material_value
                      + be.production_value
                      + be.packaging_value
                      + be.logistic_value
                      + be.waste_value
                    ), 0)::numeric AS total_emission,
                    COUNT(DISTINCT bpr.product_code) FILTER (WHERE bpr.product_code IS NOT NULL)::int AS product_count
                FROM bom_pcf_request bpr
                JOIN bom b                               ON b.bom_pcf_id = bpr.id
                JOIN bom_emission_calculation_engine be  ON be.bom_id    = b.id
                WHERE bpr.created_by = $1
            `, [user_id]);

            const recyclabilityResult = await client.query(`
                WITH material_usage AS (
                    SELECT
                        b.id AS bom_id,
                        bemce.material_type,
                        SUM(bemce.material_composition_weight::numeric) AS total_kg
                    FROM bom_pcf_request bpr
                    JOIN bom b ON b.bom_pcf_id = bpr.id
                    JOIN bom_emission_material_calculation_engine bemce ON bemce.bom_id = b.id
                    WHERE bpr.created_by = $1
                    GROUP BY b.id, bemce.material_type
                ),
                recycled_percentage AS (
                    SELECT
                        rmpq.bom_id,
                        rmpq.material_name AS material_type,
                        SUM(rmpq.percentage::numeric) AS recycled_pct
                    FROM recycled_materials_with_percentage_questions rmpq
                    JOIN bom b ON b.id = rmpq.bom_id
                    JOIN bom_pcf_request bpr ON bpr.id = b.bom_pcf_id
                    WHERE bpr.created_by = $1
                    GROUP BY rmpq.bom_id, rmpq.material_name
                )
                SELECT
                    COALESCE(SUM(mu.total_kg), 0) AS total_material,
                    COALESCE(SUM(
                        (mu.total_kg * COALESCE(rp.recycled_pct, 0)) / 100
                    ), 0) AS total_recycled
                FROM material_usage mu
                LEFT JOIN recycled_percentage rp
                    ON rp.bom_id = mu.bom_id AND rp.material_type = mu.material_type
            `, [user_id]);

            const totalEmission  = Number(emissionsResult.rows[0]?.total_emission) || 0;
            const productCount   = Number(emissionsResult.rows[0]?.product_count)  || 0;
            const avgCarbonFootprint = productCount > 0
                ? Number((totalEmission / productCount).toFixed(2))
                : 0;

            const totalMaterial = Number(recyclabilityResult.rows[0]?.total_material) || 0;
            const totalRecycled = Number(recyclabilityResult.rows[0]?.total_recycled) || 0;
            const recyclabilityRate = totalMaterial > 0
                ? Number(((totalRecycled / totalMaterial) * 100).toFixed(2))
                : 0;

            return res.status(200).send({
                success: true,
                message: "Client KPIs fetched successfully",
                data: {
                    totalProducts:       Number(productsResult.rows[0]?.total)    || 0,
                    activeSuppliers:     Number(suppliersResult.rows[0]?.active)  || 0,
                    avgCarbonFootprint,
                    recyclabilityRate,
                    totalEmission:       Number(totalEmission.toFixed(2))
                }
            });

        } catch (error: any) {
            console.error("Client KPIs error:", error);
            return res.status(500).send({
                success: false,
                message: error.message
            });
        }
    });
}

// Client's pending PCF requests (in progress, draft, awaiting)
export async function getClientPendingPcfRequests(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { user_id } = req.query;
            if (!user_id) {
                return res.status(400).send({
                    success: false,
                    message: "user_id is required"
                });
            }

            const result = await client.query(`
                SELECT
                    bpr.id,
                    bpr.code,
                    bpr.request_title,
                    bpr.product_code,
                    bpr.status,
                    bpr.is_draft,
                    bpr.is_approved,
                    bpr.is_rejected,
                    bpr.due_date,
                    bpr.priority,
                    bpr.request_organization,
                    bpr.created_date,
                    u.user_name AS customer_name
                FROM bom_pcf_request bpr
                LEFT JOIN users_table u ON u.user_id = bpr.client_id
                WHERE bpr.created_by = $1
                  AND bpr.is_approved = false
                  AND bpr.is_rejected = false
                ORDER BY
                    CASE
                        WHEN LOWER(bpr.priority) = 'high'   THEN 1
                        WHEN LOWER(bpr.priority) = 'medium' THEN 2
                        WHEN LOWER(bpr.priority) = 'low'    THEN 3
                        ELSE 4
                    END,
                    bpr.due_date ASC NULLS LAST,
                    bpr.created_date DESC
                LIMIT 4
            `, [user_id]);

            const data = result.rows.map((row: any) => {
                let uiStatus = "In Progress";
                if (row.is_draft) uiStatus = "Draft";
                else if (row.status && String(row.status).toLowerCase().includes("review")) uiStatus = "In Review";
                else if (row.status && String(row.status).toLowerCase().includes("wait")) uiStatus = "Awaiting Data";
                else if (row.status && String(row.status).toLowerCase().includes("action")) uiStatus = "Action Required";

                return {
                    id:       row.code || row.id,
                    product:  row.request_title || row.product_code || row.code,
                    customer: row.customer_name || row.request_organization || "",
                    dueDate:  row.due_date,
                    priority: (row.priority || "medium").toLowerCase(),
                    status:   uiStatus
                };
            });

            return res.status(200).send({
                success: true,
                message: "Pending PCF requests fetched successfully",
                data
            });

        } catch (error: any) {
            console.error("Client pending PCF error:", error);
            return res.status(500).send({
                success: false,
                message: error.message
            });
        }
    });
}

// Client recent activity (their own PCF + task events)
export async function getClientRecentActivity(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { user_id } = req.query;
            if (!user_id) {
                return res.status(400).send({
                    success: false,
                    message: "user_id is required"
                });
            }

            const result = await client.query(`
                SELECT
                    bpr.id,
                    bpr.code,
                    bpr.request_title,
                    bpr.product_code,
                    bpr.is_approved,
                    bpr.is_rejected,
                    bpr.is_draft,
                    bpr.status,
                    bpr.update_date,
                    bpr.created_date
                FROM bom_pcf_request bpr
                WHERE bpr.created_by = $1
                ORDER BY COALESCE(bpr.update_date, bpr.created_date) DESC
                LIMIT 8
            `, [user_id]);

            const data = result.rows.map((row: any) => {
                let description = "PCF request created";
                let type: string = "info";
                if (row.is_approved)       { description = "PCF report submitted"; type = "success"; }
                else if (row.is_rejected)  { description = "PCF request rejected"; type = "warning"; }
                else if (row.is_draft)     { description = "PCF request saved as draft"; type = "info"; }
                else if (row.status && String(row.status).toLowerCase().includes("progress"))
                    { description = "PCF request in progress"; type = "info"; }

                return {
                    id:          row.id,
                    description,
                    target:      row.request_title || row.product_code || row.code,
                    timestamp:   row.update_date || row.created_date,
                    type
                };
            });

            return res.status(200).send({
                success: true,
                message: "Client recent activity fetched successfully",
                data
            });

        } catch (error: any) {
            console.error("Client recent activity error:", error);
            return res.status(500).send({
                success: false,
                message: error.message
            });
        }
    });
}

// Top suppliers by emission contribution for the logged-in client's PCFs
export async function getClientTopSuppliers(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { user_id } = req.query;
            if (!user_id) {
                return res.status(400).send({
                    success: false,
                    message: "user_id is required"
                });
            }

            const result = await client.query(`
                SELECT
                    s.sup_id,
                    COALESCE(s.supplier_company_name, s.supplier_name, 'Unknown Supplier') AS supplier_name,
                    s.supplier_city,
                    s.supplier_country,
                    s.supplier_business_type AS category,
                    COALESCE(SUM(
                        be.material_value
                      + be.production_value
                      + be.packaging_value
                      + be.logistic_value
                      + be.waste_value
                    ), 0)::numeric AS total_emission
                FROM bom_pcf_request bpr
                JOIN bom b                              ON b.bom_pcf_id = bpr.id
                JOIN supplier_details s                 ON s.sup_id = b.supplier_id
                LEFT JOIN bom_emission_calculation_engine be ON be.bom_id = b.id
                WHERE bpr.created_by = $1
                GROUP BY s.sup_id, s.supplier_company_name, s.supplier_name, s.supplier_city, s.supplier_country, s.supplier_business_type
                HAVING COALESCE(SUM(
                    be.material_value
                  + be.production_value
                  + be.packaging_value
                  + be.logistic_value
                  + be.waste_value
                ), 0) > 0
                ORDER BY total_emission DESC
                LIMIT 5
            `, [user_id]);

            const totalAllSuppliers = result.rows.reduce(
                (sum: number, row: any) => sum + Number(row.total_emission),
                0
            );

            const data = result.rows.map((row: any) => {
                const emission = Number(row.total_emission);
                return {
                    name:       row.supplier_name,
                    city:       row.supplier_city,
                    country:    row.supplier_country,
                    category:   row.category || "",
                    emission:   Number(emission.toFixed(2)),
                    percentage: totalAllSuppliers > 0
                        ? Number(((emission / totalAllSuppliers) * 100).toFixed(1))
                        : 0
                };
            });

            return res.status(200).send({
                success: true,
                message: "Top suppliers fetched successfully",
                data
            });

        } catch (error: any) {
            console.error("Client top suppliers error:", error);
            return res.status(500).send({
                success: false,
                message: error.message
            });
        }
    });
}

// Energy + waste resource consumption for the logged-in client (water unavailable in schema)
export async function getClientEnergyResources(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { user_id } = req.query;
            if (!user_id) {
                return res.status(400).send({
                    success: false,
                    message: "user_id is required"
                });
            }

            const energyResult = await client.query(`
                SELECT
                    COALESCE(SUM(
                        COALESCE(pe.total_electrical_energy_consumed_at_factory_level_kWh, 0)
                      + COALESCE(pe.total_heating_energy_consumed_at_factory_level_kWh,   0)
                      + COALESCE(pe.total_cooling_energy_consumed_at_factory_level_kWh,   0)
                      + COALESCE(pe.total_steam_energy_consumed_at_factory_level_kWh,     0)
                    ), 0)::numeric AS energy_kwh
                FROM bom_pcf_request bpr
                JOIN bom b                                          ON b.bom_pcf_id = bpr.id
                JOIN bom_emission_production_calculation_engine pe  ON pe.bom_id    = b.id
                WHERE bpr.created_by = $1
            `, [user_id]);

            const wasteResult = await client.query(`
                SELECT
                    COALESCE(SUM(w.waste_generated_per_box_kg), 0)::numeric AS waste_kg
                FROM bom_pcf_request bpr
                JOIN bom b                                      ON b.bom_pcf_id = bpr.id
                JOIN bom_emission_waste_calculation_engine w    ON w.bom_id     = b.id
                WHERE bpr.created_by = $1
            `, [user_id]);

            return res.status(200).send({
                success: true,
                message: "Energy & resources fetched successfully",
                data: {
                    energyKwh: Number(Number(energyResult.rows[0]?.energy_kwh ?? 0).toFixed(2)),
                    wasteKg:   Number(Number(wasteResult.rows[0]?.waste_kg    ?? 0).toFixed(2))
                }
            });

        } catch (error: any) {
            console.error("Client energy & resources error:", error);
            return res.status(500).send({
                success: false,
                message: error.message
            });
        }
    });
}

// Top emission hotspots for the logged-in client — derived from top-emitting PCFs
export async function getClientEmissionHotspots(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { user_id } = req.query;
            if (!user_id) {
                return res.status(400).send({
                    success: false,
                    message: "user_id is required"
                });
            }

            const result = await client.query(`
                SELECT
                    bpr.id,
                    bpr.code,
                    COALESCE(bpr.request_title, bpr.product_code, bpr.code) AS hotspot_name,
                    COALESCE(SUM(
                        be.material_value
                      + be.production_value
                      + be.packaging_value
                      + be.logistic_value
                      + be.waste_value
                    ), 0)::numeric AS emission
                FROM bom_pcf_request bpr
                JOIN bom b                               ON b.bom_pcf_id = bpr.id
                JOIN bom_emission_calculation_engine be  ON be.bom_id    = b.id
                WHERE bpr.created_by = $1
                GROUP BY bpr.id, bpr.code, bpr.request_title, bpr.product_code
                HAVING SUM(
                    be.material_value
                  + be.production_value
                  + be.packaging_value
                  + be.logistic_value
                  + be.waste_value
                ) > 0
                ORDER BY emission DESC
                LIMIT 5
            `, [user_id]);

            const grandTotal = result.rows.reduce(
                (sum: number, row: any) => sum + Number(row.emission),
                0
            );

            const data = result.rows.map((row: any) => {
                const em = Number(row.emission);
                return {
                    name:       row.hotspot_name,
                    emission:   Number(em.toFixed(2)),
                    percentage: grandTotal > 0
                        ? Number(((em / grandTotal) * 100).toFixed(1))
                        : 0
                };
            });

            return res.status(200).send({
                success: true,
                message: "Emission hotspots fetched successfully",
                data
            });

        } catch (error: any) {
            console.error("Client emission hotspots error:", error);
            return res.status(500).send({
                success: false,
                message: error.message
            });
        }
    });
}

// Client alerts — derived from overdue tasks, rejected PCFs, long-pending drafts
export async function getClientAlerts(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { user_id } = req.query;
            if (!user_id) {
                return res.status(400).send({
                    success: false,
                    message: "user_id is required"
                });
            }

            const overdueTasksResult = await client.query(`
                SELECT COUNT(*)::int AS cnt
                FROM task_managment
                WHERE $1 = ANY(assign_to)
                  AND due_date < NOW()
                  AND LOWER(COALESCE(status, '')) NOT IN ('completed', 'done', 'closed')
            `, [user_id]);

            const rejectedPcfResult = await client.query(`
                SELECT COUNT(*)::int AS cnt
                FROM bom_pcf_request
                WHERE created_by = $1
                  AND is_rejected = true
            `, [user_id]);

            const oldDraftsResult = await client.query(`
                SELECT COUNT(*)::int AS cnt
                FROM bom_pcf_request
                WHERE created_by = $1
                  AND is_draft = true
                  AND created_date < (NOW() - INTERVAL '7 days')
            `, [user_id]);

            const approachingDueResult = await client.query(`
                SELECT COUNT(*)::int AS cnt
                FROM bom_pcf_request
                WHERE created_by = $1
                  AND is_approved = false
                  AND is_rejected = false
                  AND due_date IS NOT NULL
                  AND due_date BETWEEN NOW() AND (NOW() + INTERVAL '7 days')
            `, [user_id]);

            const alerts = [];
            const overdue = Number(overdueTasksResult.rows[0]?.cnt) || 0;
            const rejected = Number(rejectedPcfResult.rows[0]?.cnt) || 0;
            const oldDrafts = Number(oldDraftsResult.rows[0]?.cnt) || 0;
            const approaching = Number(approachingDueResult.rows[0]?.cnt) || 0;

            if (overdue > 0) {
                alerts.push({
                    type: "task_overdue",
                    severity: "high",
                    title: "Overdue tasks",
                    subtitle: `${overdue} task${overdue === 1 ? "" : "s"} past due date`
                });
            }
            if (approaching > 0) {
                alerts.push({
                    type: "pcf_due_soon",
                    severity: "medium",
                    title: "PCF requests due soon",
                    subtitle: `${approaching} request${approaching === 1 ? "" : "s"} due within 7 days`
                });
            }
            if (rejected > 0) {
                alerts.push({
                    type: "pcf_rejected",
                    severity: "high",
                    title: "Rejected PCF requests",
                    subtitle: `${rejected} request${rejected === 1 ? "" : "s"} require attention`
                });
            }
            if (oldDrafts > 0) {
                alerts.push({
                    type: "stale_draft",
                    severity: "low",
                    title: "Stale drafts",
                    subtitle: `${oldDrafts} draft${oldDrafts === 1 ? "" : "s"} older than 7 days`
                });
            }

            return res.status(200).send({
                success: true,
                message: "Client alerts fetched successfully",
                data: {
                    count: alerts.length,
                    alerts
                }
            });

        } catch (error: any) {
            console.error("Client alerts error:", error);
            return res.status(500).send({
                success: false,
                message: error.message
            });
        }
    });
}
