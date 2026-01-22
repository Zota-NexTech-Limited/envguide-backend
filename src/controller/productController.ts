import { withClient } from '../util/database';
import { ulid } from 'ulid';
import { generateResponse } from '../util/genRes';

export async function createProduct(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            await client.query("BEGIN");

            const {
                product_code,
                product_name,
                product_category_id,
                product_sub_category_id,
                description,
                ts_weight_kg,
                ts_dimensions,
                ts_material,
                ts_manufacturing_process_id,
                ts_supplier,
                ts_part_number,
                ed_estimated_pcf,
                ed_recyclability,
                ed_life_cycle_stage_id,
                ed_renewable_energy
            } = req.body;

            const created_by = req.user_id;
            const id = ulid();

            if (!product_code || product_code.trim() === "") {
                return res.send(generateResponse(false, "product_code is required", 400, null));
            }
            if (!product_name || product_name.trim() === "") {
                return res.send(generateResponse(false, "product_name is required", 400, null));
            }
            if (!product_category_id || product_category_id.trim() === "") {
                return res.send(generateResponse(false, "product_category_id is required", 400, null));
            }

            // 🔍 CHECK IF PRODUCT CODE ALREADY EXISTS
            const codeCheck = await client.query(
                `SELECT id FROM product WHERE product_code = $1`,
                [product_code]
            );

            if (codeCheck.rows.length > 0) {
                await client.query("ROLLBACK");
                return res.send(
                    generateResponse(false, "Product code already exists", 400, null)
                );
            }

            const insertQuery = `
                INSERT INTO product (
                    id, product_code, product_name, product_category_id, 
                    product_sub_category_id, description, ts_weight_kg, 
                    ts_dimensions, ts_material, ts_manufacturing_process_id, 
                    ts_supplier, ts_part_number, ed_estimated_pcf, 
                    ed_recyclability, ed_life_cycle_stage_id, 
                    ed_renewable_energy, created_by
                ) VALUES (
                    $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17
                ) RETURNING *;
            `;

            const result = await client.query(insertQuery, [
                id, product_code, product_name, product_category_id,
                product_sub_category_id, description, ts_weight_kg,
                ts_dimensions, ts_material, ts_manufacturing_process_id,
                ts_supplier, ts_part_number, ed_estimated_pcf,
                ed_recyclability, ed_life_cycle_stage_id,
                ed_renewable_energy, created_by
            ]);

            await client.query("COMMIT");

            return res.send(generateResponse(true, "Product created", 200, result.rows[0]));

        } catch (error: any) {
            await client.query("ROLLBACK");
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function updateProduct(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            await client.query("BEGIN");

            const {
                id,
                product_code,
                product_name,
                product_category_id,
                product_sub_category_id,
                description,
                ts_weight_kg,
                ts_dimensions,
                ts_material,
                ts_manufacturing_process_id,
                ts_supplier,
                ts_part_number,
                ed_estimated_pcf,
                ed_recyclability,
                ed_life_cycle_stage_id,
                ed_renewable_energy
            } = req.body;

            const updated_by = req.user_id;

            // 🔐 REQUIRED FIELD VALIDATION
            if (!product_code || product_code.trim() === "") {
                return res.send(generateResponse(false, "product_code is required", 400, null));
            }
            if (!product_name || product_name.trim() === "") {
                return res.send(generateResponse(false, "product_name is required", 400, null));
            }
            if (!product_category_id || product_category_id.trim() === "") {
                return res.send(generateResponse(false, "product_category_id is required", 400, null));
            }

            // 🔍 CHECK UNIQUE CODE FOR OTHER PRODUCTS
            const codeCheck = await client.query(
                `SELECT id FROM product WHERE product_code = $1 AND id <> $2`,
                [product_code, id]
            );

            if (codeCheck.rows.length > 0) {
                return res.send(generateResponse(false, "Product code already exists", 400, null));
            }

            const updateQuery = `
                UPDATE product
                SET product_code = $1,
                    product_name = $2,
                    product_category_id = $3,
                    product_sub_category_id = $4,
                    description = $5,
                    ts_weight_kg = $6,
                    ts_dimensions = $7,
                    ts_material = $8,
                    ts_manufacturing_process_id = $9,
                    ts_supplier = $10,
                    ts_part_number = $11,
                    ed_estimated_pcf = $12,
                    ed_recyclability = $13,
                    ed_life_cycle_stage_id = $14,
                    ed_renewable_energy = $15,
                    updated_by = $16,
                    update_date = NOW()
                WHERE id = $17
                RETURNING *;
            `;

            const result = await client.query(updateQuery, [
                product_code,
                product_name,
                product_category_id,
                product_sub_category_id,
                description,
                ts_weight_kg,
                ts_dimensions,
                ts_material,
                ts_manufacturing_process_id,
                ts_supplier,
                ts_part_number,
                ed_estimated_pcf,
                ed_recyclability,
                ed_life_cycle_stage_id,
                ed_renewable_energy,
                updated_by,
                id
            ]);

            await client.query("COMMIT");

            return res.send(generateResponse(true, "Product updated", 200, result.rows[0]));

        } catch (err: any) {
            await client.query("ROLLBACK");
            return res.send(generateResponse(false, err.message, 400, null));
        }
    });
}

export async function getProductById(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { id } = req.query;

            const productQuery = `
                SELECT p.*,
                       pc.code AS category_code,
                       pc.name AS category_name,
                       sc.code AS sub_category_code,
                       sc.name AS sub_category_name,
                       mp.code AS manufacturing_process_code,
                       mp.name AS manufacturing_process_name,
                       lc.code AS life_cycle_stage_code,
                       lc.name AS life_cycle_stage_name,
                       u1.user_name AS created_by_name,
                       u2.user_name AS updated_by_name
                FROM product p
                LEFT JOIN product_category pc ON p.product_category_id = pc.id
                LEFT JOIN product_sub_category sc ON p.product_sub_category_id = sc.id
                LEFT JOIN manufacturing_process mp ON p.ts_manufacturing_process_id = mp.id
                LEFT JOIN life_cycle_stage lc ON p.ed_life_cycle_stage_id = lc.id
                LEFT JOIN users_table u1 ON p.created_by = u1.user_id
                LEFT JOIN users_table u2 ON p.updated_by = u2.user_id
                WHERE p.id = $1;
            `;

            const productResult = await client.query(productQuery, [id]);

            if (productResult.rows.length === 0) {
                return res.send(generateResponse(false, "Product not found", 404, null));
            }

            let product = productResult.rows[0];

            // ---------- Fetch Own Emission (Separate) ----------
            const ownEmissionQuery = `
                SELECT oe.*,
                       cm.name AS calculation_method_name,
                       fc.name AS fuel_combustion_name,
                       pe.name AS process_emission_name,
                       fe.name AS fugitive_emission_name,
                       elb.name AS electicity_location_based_name,
                       emb.name AS electicity_market_based_name,
                       shc.name AS steam_heat_cooling_name,
                       u1.user_name AS created_by_name,
                       u2.user_name AS updated_by_name
                FROM own_emission oe
                LEFT JOIN calculation_method cm ON oe.calculation_method_id = cm.id
                LEFT JOIN fuel_combustion fc ON oe.fuel_combustion_id = fc.id
                LEFT JOIN process_emission pe ON oe.process_emission_id = pe.id
                LEFT JOIN fugitive_emission fe ON oe.fugitive_emission_id = fe.id
                LEFT JOIN electicity_location_based elb ON oe.electicity_location_based_id = elb.id
                LEFT JOIN electicity_market_based emb ON oe.electicity_market_based_id = emb.id
                LEFT JOIN steam_heat_cooling shc ON oe.steam_heat_cooling_id = shc.id
                LEFT JOIN users_table u1 ON oe.created_by = u1.user_id
                LEFT JOIN users_table u2 ON oe.updated_by = u2.user_id
                WHERE oe.product_id = $1;
            `;

            const ownEmissionResult = await client.query(ownEmissionQuery, [id]);

            // Add separate nested object
            product.own_emission = ownEmissionResult.rows.length ? ownEmissionResult.rows[0] : null;

            if (product.own_emission) {
                const docs = await client.query(
                    `SELECT * FROM own_emission_supporting_document WHERE own_emission_id = $1;`,
                    [ownEmissionResult.rows[0].id]
                );
                product.own_emission.supporting_documents = docs.rows;
            }

            return res.send(generateResponse(true, "Fetched successfully", 200, product));


        } catch (err: any) {
            return res.send(generateResponse(false, err.message, 400, null));
        }
    });
}

export async function listProducts(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const {
                pageNumber = 1,
                pageSize = 10,
                start_date,
                end_date,
                category_name,
                sub_ategory_name,
                pcf_status,
                product_name,
                search = ""
            } = req.query;

            const offset = (pageNumber - 1) * pageSize;
            const limit = pageSize;

            let whereClauses: string[] = [];
            let params: any[] = [];
            let index = 1;

            // Filter: Date Range
            if (start_date && end_date) {
                whereClauses.push(`p.update_date BETWEEN $${index} AND $${index + 1}`);
                params.push(start_date, end_date);
                index += 2;
            }

            // Filter: Category Name
            if (category_name) {
                whereClauses.push(`pc.name ILIKE $${index}`);
                params.push(`%${category_name}%`);
                index++;
            }

             if (product_name) {
                whereClauses.push(`p.product_name ILIKE $${index}`);
                params.push(`%${product_name}%`);
                index++;
            }

              if (sub_ategory_name) {
                whereClauses.push(`sc.name ILIKE $${index}`);
                params.push(`%${sub_ategory_name}%`);
                index++;
            }


            // Filter: PCF Status
            if (pcf_status) {
                whereClauses.push(`p.pcf_status = $${index}`);
                params.push(pcf_status);
                index++;
            }

            // Optional Search (product_code, product_name)
            if (search) {
                whereClauses.push(`(
                    p.product_code ILIKE $${index} OR 
                    p.product_name ILIKE $${index} OR
                    sc.name ILIKE $${index} OR
                    pc.name ILIKE $${index}
                    
                )`);
                params.push(`%${search}%`);
                index++;
            }

            const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

            const query = `
                SELECT p.*,
                       pc.code AS category_code,
                       pc.name AS category_name,
                       sc.code AS sub_category_code,
                       sc.name AS sub_category_name,
                       mp.name AS manufacturing_process_name,
                       lc.name AS life_cycle_stage_name,
                       u1.user_name AS created_by_name,
                       u2.user_name AS updated_by_name
                FROM product p
                LEFT JOIN product_category pc ON p.product_category_id = pc.id
                LEFT JOIN product_sub_category sc ON p.product_sub_category_id = sc.id
                LEFT JOIN manufacturing_process mp ON p.ts_manufacturing_process_id = mp.id
                LEFT JOIN life_cycle_stage lc ON p.ed_life_cycle_stage_id = lc.id
                LEFT JOIN users_table u1 ON p.created_by = u1.user_id
                LEFT JOIN users_table u2 ON p.updated_by = u2.user_id
                ${whereSQL}
                ORDER BY p.update_date DESC
                LIMIT ${limit} OFFSET ${offset};
            `;

            const result = await client.query(query, params);

            return res.send(generateResponse(true, "Fetched successfully", 200, result.rows));

        } catch (err: any) {
            console.error("❌ Error listing products:", err);
            return res.send(generateResponse(false, err.message, 400, null));
        }
    });
}

export async function productsDropDown(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const query = `
                SELECT 
                p.id,
                p.product_code,
                p.product_name
                FROM product p
                ORDER BY p.update_date DESC
            `;

            const result = await client.query(query);

            return res.send(generateResponse(true, "Fetched successfully", 200, result.rows));

        } catch (err: any) {
            console.error("❌ Error listing products:", err);
            return res.send(generateResponse(false, err.message, 400, null));
        }
    });
}