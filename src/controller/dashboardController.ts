import { withClient } from '../util/database';
import { generateResponse } from '../util/genRes';

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

export async function getClients(req: any, res: any) {
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
            THEN AVG(eef.ef_india_region::numeric)
        WHEN psd.location = 'europe'
            THEN AVG(eef.ef_eu_region::numeric)
        ELSE
            AVG(eef.ef_global_region::numeric)
    END AS emission_value,

    /* total emission */
    SUM(
        pseq.quantity_consumed *
        CASE
            WHEN psd.location = 'india'
                THEN eef.ef_india_region::numeric
            WHEN psd.location = 'europe'
                THEN eef.ef_eu_region::numeric
            ELSE
                eef.ef_global_region::numeric
        END
    ) AS total_emission_value

FROM bom_pcf_request bpr
JOIN bom b
    ON b.bom_pcf_id = bpr.id
JOIN process_specific_energy_usage_questions pseq
    ON pseq.bom_id = b.id

/* 🔥 FIX: ensure ONE row per BOM */
JOIN (
    SELECT DISTINCT ON (bom_id)
        bom_id,
        LOWER(location) AS location
    FROM production_site_details_questions
    ORDER BY bom_id
) psd
    ON psd.bom_id = b.id

JOIN electricity_emission_factor eef
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
                            THEN AVG(eef.ef_india_region::numeric)
                        WHEN psd.location = 'europe'
                            THEN AVG(eef.ef_eu_region::numeric)
                        ELSE
                            AVG(eef.ef_global_region::numeric)
                    END AS emission_value,

                    SUM(
                        pseq.quantity_consumed *
                        CASE
                            WHEN psd.location = 'india'
                                THEN eef.ef_india_region::numeric
                            WHEN psd.location = 'europe'
                                THEN eef.ef_eu_region::numeric
                            ELSE
                                eef.ef_global_region::numeric
                        END
                    ) AS total_emission_value

                FROM bom_pcf_request bpr
                JOIN bom b ON b.bom_pcf_id = bpr.id
                JOIN process_specific_energy_usage_questions pseq ON pseq.bom_id = b.id

                JOIN (
                    SELECT DISTINCT ON (bom_id)
                        bom_id,
                        LOWER(location) AS location
                    FROM production_site_details_questions
                    ORDER BY bom_id
                ) psd ON psd.bom_id = b.id

                JOIN electricity_emission_factor eef
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
                JOIN supplier_product_questions spq
                    ON spq.sgiq_id = sgiq.sgiq_id
                JOIN production_site_details_questions psdq
                    ON psdq.spq_id = spq.spq_id
                LIMIT 1
                `
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
