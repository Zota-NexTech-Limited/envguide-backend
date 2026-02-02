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
