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
                ed_renewable_energy,
                product_status
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
                    ed_renewable_energy, created_by,product_status
                ) VALUES (
                    $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18
                ) RETURNING *;
            `;

            const result = await client.query(insertQuery, [
                id, product_code, product_name, product_category_id,
                product_sub_category_id, description, ts_weight_kg,
                ts_dimensions, ts_material, ts_manufacturing_process_id,
                ts_supplier, ts_part_number, ed_estimated_pcf,
                ed_recyclability, ed_life_cycle_stage_id,
                ed_renewable_energy, created_by, product_status
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
                ed_renewable_energy,
                product_status,
                own_emission_id,
                own_emission_status
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
                    update_date = NOW(),
                    product_status=$18
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
                id,
                product_status
            ]);

            if (own_emission_id) {
                const updateStatusOwnEmission = `
                UPDATE own_emission
                SET own_emission_status = $1,
                WHERE id = $2
                RETURNING *;
            `;

                await client.query(updateStatusOwnEmission, [
                    own_emission_status,
                    own_emission_id
                ]);
            }
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

            /* ================= PRODUCT PCF (MASTER) ================= */
            const pcfMaster = await client.query(
                `SELECT * FROM product_pcf WHERE product_id = $1 ORDER BY created_date DESC LIMIT 1`,
                [id]
            );

            if (pcfMaster.rows.length === 0) {
                product.product_pcf = null;
            } else {
                const pcf = pcfMaster.rows[0];

                const [
                    rawMaterial,
                    energy,
                    manufacturing,
                    transportation,
                    packaging
                ] = await Promise.all([
                    client.query(
                        `SELECT * FROM product_pcf_raw_material_component
                         WHERE product_id = $1 ORDER BY created_date`,
                        [id]
                    ),
                    client.query(
                        `SELECT * FROM product_pcf_energy_consumption
                         WHERE product_id = $1`,
                        [id]
                    ),
                    client.query(
                        `SELECT * FROM product_pcf_manufacturing_process
                         WHERE product_id = $1`,
                        [id]
                    ),
                    client.query(
                        `SELECT * FROM product_pcf_transportation
                         WHERE product_id = $1 ORDER BY created_date`,
                        [id]
                    ),
                    client.query(
                        `SELECT * FROM product_pcf_packaging
                         WHERE product_id = $1 ORDER BY created_date`,
                        [id]
                    )
                ]);

                product.product_pcf = {
                    product_pcf: pcf,
                    product_pcf_raw_material_component: rawMaterial.rows,
                    product_pcf_energy_consumption: energy.rows[0] || null,
                    product_pcf_manufacturing_process: manufacturing.rows[0] || null,
                    product_pcf_transportation: transportation.rows,
                    product_pcf_packaging: packaging.rows
                };
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

export async function createProductPCF(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            await client.query("BEGIN");

            const created_by = req.user_id;

            const {
                product_pcf,
                product_pcf_raw_material_component,
                product_pcf_energy_consumption,
                product_pcf_manufacturing_process,
                product_pcf_transportation,
                product_pcf_packaging
            } = req.body;

            /* ================= PRODUCT PCF (MASTER) ================= */
            const pcf_id = ulid();

            await client.query(
                `INSERT INTO product_pcf (
                    id, product_id, product_name, pcf_name, version,
                    data_model, calculation_method, production_location,
                    functional_unit, functional_unit_type, reference_year,
                    validity_period, description, storage_duration, created_by
                ) VALUES (
                    $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15
                )`,
                [
                    pcf_id,
                    product_pcf.product_id,
                    product_pcf.product_name,
                    product_pcf.pcf_name,
                    product_pcf.version,
                    product_pcf.data_model,
                    product_pcf.calculation_method,
                    product_pcf.production_location,
                    product_pcf.functional_unit,
                    product_pcf.functional_unit_type,
                    product_pcf.reference_year,
                    product_pcf.validity_period,
                    product_pcf.description,
                    product_pcf.storage_duration,
                    created_by
                ]
            );

            /* ================= RAW MATERIAL COMPONENT (ARRAY) ================= */
            if (Array.isArray(product_pcf_raw_material_component)) {
                for (const item of product_pcf_raw_material_component) {
                    await client.query(
                        `INSERT INTO product_pcf_raw_material_component (
                            pprmc_id, product_id, material_type,
                            quantity, unit, co2e_factor, created_by
                        ) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
                        [
                            ulid(),
                            item.product_id,
                            item.material_type,
                            item.quantity,
                            item.unit,
                            item.co2e_factor,
                            created_by
                        ]
                    );
                }
            }

            /* ================= ENERGY CONSUMPTION ================= */
            if (product_pcf_energy_consumption) {
                await client.query(
                    `INSERT INTO product_pcf_energy_consumption (
                        ppec_id, product_id, electricity_consumption,
                        electricity_consumption_type, energy_source,
                        heat_consumption, heat_consumption_type,
                        fuel_type, created_by
                    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
                    [
                        ulid(),
                        product_pcf_energy_consumption.product_id,
                        product_pcf_energy_consumption.electricity_consumption,
                        product_pcf_energy_consumption.electricity_consumption_type,
                        product_pcf_energy_consumption.energy_source,
                        product_pcf_energy_consumption.heat_consumption,
                        product_pcf_energy_consumption.heat_consumption_type,
                        product_pcf_energy_consumption.fuel_type,
                        created_by
                    ]
                );
            }

            /* ================= MANUFACTURING PROCESS ================= */
            if (product_pcf_manufacturing_process) {
                await client.query(
                    `INSERT INTO product_pcf_manufacturing_process (
                        ppmp_id, product_id, process_type,
                        processing_time, processing_time_type,
                        waste_generated, waste_generated_type,
                        recyclable, treatment_method, created_by
                    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
                    [
                        ulid(),
                        product_pcf_manufacturing_process.product_id,
                        product_pcf_manufacturing_process.process_type,
                        product_pcf_manufacturing_process.processing_time,
                        product_pcf_manufacturing_process.processing_time_type,
                        product_pcf_manufacturing_process.waste_generated,
                        product_pcf_manufacturing_process.waste_generated_type,
                        product_pcf_manufacturing_process.recyclable,
                        product_pcf_manufacturing_process.treatment_method,
                        created_by
                    ]
                );
            }

            /* ================= TRANSPORTATION (ARRAY) ================= */
            if (Array.isArray(product_pcf_transportation)) {
                for (const item of product_pcf_transportation) {
                    await client.query(
                        `INSERT INTO product_pcf_transportation (
                            ppt_id, product_id, transport_mode,
                            vehicle_type, distance, distance_type,
                            load_factor, load_factor_type,
                            fuel_type, created_by
                        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
                        [
                            ulid(),
                            item.product_id,
                            item.transport_mode,
                            item.vehicle_type,
                            item.distance,
                            item.distance_type,
                            item.load_factor,
                            item.load_factor_type,
                            item.fuel_type,
                            created_by
                        ]
                    );
                }
            }

            /* ================= PACKAGING (ARRAY) ================= */
            if (Array.isArray(product_pcf_packaging)) {
                for (const item of product_pcf_packaging) {
                    await client.query(
                        `INSERT INTO product_pcf_packaging (
                            ppp_id, product_id, packaging_type,
                            material, weight, weight_type,
                            recyclability, created_by
                        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
                        [
                            ulid(),
                            item.product_id,
                            item.packaging_type,
                            item.material,
                            item.weight,
                            item.weight_type,
                            item.recyclability,
                            created_by
                        ]
                    );
                }
            }

            await client.query("COMMIT");
            return res.send(generateResponse(true, "Product PCF created successfully", 200, null));

        } catch (error: any) {
            await client.query("ROLLBACK");
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function updateProductPCF(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            await client.query("BEGIN");

            const updated_by = req.user_id;

            const {
                product_pcf,
                product_pcf_raw_material_component,
                product_pcf_energy_consumption,
                product_pcf_manufacturing_process,
                product_pcf_transportation,
                product_pcf_packaging
            } = req.body;

            /* ================= UPDATE PRODUCT PCF ================= */
            if (product_pcf?.id) {
                await client.query(
                    `UPDATE product_pcf
                     SET
                        pcf_name = $2,
                        version = $3,
                        data_model = $4,
                        calculation_method = $5,
                        production_location = $6,
                        functional_unit = $7,
                        functional_unit_type = $8,
                        reference_year = $9,
                        validity_period = $10,
                        description = $11,
                        storage_duration = $12,
                        updated_by = $13,
                        update_date = CURRENT_TIMESTAMP
                     WHERE id = $1`,
                    [
                        product_pcf.id,
                        product_pcf.pcf_name,
                        product_pcf.version,
                        product_pcf.data_model,
                        product_pcf.calculation_method,
                        product_pcf.production_location,
                        product_pcf.functional_unit,
                        product_pcf.functional_unit_type,
                        product_pcf.reference_year,
                        product_pcf.validity_period,
                        product_pcf.description,
                        product_pcf.storage_duration,
                        updated_by
                    ]
                );
            }

            /* ================= RAW MATERIAL COMPONENT ================= */
            if (Array.isArray(product_pcf_raw_material_component)) {
                for (const item of product_pcf_raw_material_component) {
                    if (!item.pprmc_id) continue;

                    await client.query(
                        `UPDATE product_pcf_raw_material_component
                         SET
                            material_type = $2,
                            quantity = $3,
                            unit = $4,
                            co2e_factor = $5,
                            updated_by = $6,
                            update_date = CURRENT_TIMESTAMP
                         WHERE pprmc_id = $1`,
                        [
                            item.pprmc_id,
                            item.material_type,
                            item.quantity,
                            item.unit,
                            item.co2e_factor,
                            updated_by
                        ]
                    );
                }
            }

            /* ================= ENERGY CONSUMPTION ================= */
            if (product_pcf_energy_consumption?.ppec_id) {
                await client.query(
                    `UPDATE product_pcf_energy_consumption
                     SET
                        electricity_consumption = $2,
                        electricity_consumption_type = $3,
                        energy_source = $4,
                        heat_consumption = $5,
                        heat_consumption_type = $6,
                        fuel_type = $7,
                        updated_by = $8,
                        update_date = CURRENT_TIMESTAMP
                     WHERE ppec_id = $1`,
                    [
                        product_pcf_energy_consumption.ppec_id,
                        product_pcf_energy_consumption.electricity_consumption,
                        product_pcf_energy_consumption.electricity_consumption_type,
                        product_pcf_energy_consumption.energy_source,
                        product_pcf_energy_consumption.heat_consumption,
                        product_pcf_energy_consumption.heat_consumption_type,
                        product_pcf_energy_consumption.fuel_type,
                        updated_by
                    ]
                );
            }

            /* ================= MANUFACTURING PROCESS ================= */
            if (product_pcf_manufacturing_process?.ppmp_id) {
                await client.query(
                    `UPDATE product_pcf_manufacturing_process
                     SET
                        process_type = $2,
                        processing_time = $3,
                        processing_time_type = $4,
                        waste_generated = $5,
                        waste_generated_type = $6,
                        recyclable = $7,
                        treatment_method = $8,
                        updated_by = $9,
                        update_date = CURRENT_TIMESTAMP
                     WHERE ppmp_id = $1`,
                    [
                        product_pcf_manufacturing_process.ppmp_id,
                        product_pcf_manufacturing_process.process_type,
                        product_pcf_manufacturing_process.processing_time,
                        product_pcf_manufacturing_process.processing_time_type,
                        product_pcf_manufacturing_process.waste_generated,
                        product_pcf_manufacturing_process.waste_generated_type,
                        product_pcf_manufacturing_process.recyclable,
                        product_pcf_manufacturing_process.treatment_method,
                        updated_by
                    ]
                );
            }

            /* ================= TRANSPORTATION ================= */
            if (Array.isArray(product_pcf_transportation)) {
                for (const item of product_pcf_transportation) {
                    if (!item.ppt_id) continue;

                    await client.query(
                        `UPDATE product_pcf_transportation
                         SET
                            transport_mode = $2,
                            vehicle_type = $3,
                            distance = $4,
                            distance_type = $5,
                            load_factor = $6,
                            load_factor_type = $7,
                            fuel_type = $8,
                            updated_by = $9,
                            update_date = CURRENT_TIMESTAMP
                         WHERE ppt_id = $1`,
                        [
                            item.ppt_id,
                            item.transport_mode,
                            item.vehicle_type,
                            item.distance,
                            item.distance_type,
                            item.load_factor,
                            item.load_factor_type,
                            item.fuel_type,
                            updated_by
                        ]
                    );
                }
            }

            /* ================= PACKAGING ================= */
            if (Array.isArray(product_pcf_packaging)) {
                for (const item of product_pcf_packaging) {
                    if (!item.ppp_id) continue;

                    await client.query(
                        `UPDATE product_pcf_packaging
                         SET
                            packaging_type = $2,
                            material = $3,
                            weight = $4,
                            weight_type = $5,
                            recyclability = $6,
                            updated_by = $7,
                            update_date = CURRENT_TIMESTAMP
                         WHERE ppp_id = $1`,
                        [
                            item.ppp_id,
                            item.packaging_type,
                            item.material,
                            item.weight,
                            item.weight_type,
                            item.recyclability,
                            updated_by
                        ]
                    );
                }
            }

            await client.query("COMMIT");
            return res.send(generateResponse(true, "PCF updated successfully", 200, null));

        } catch (error: any) {
            await client.query("ROLLBACK");
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function getProductPCFById(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { pcf_id } = req.query;

            if (!pcf_id) {
                return res.send(generateResponse(false, "pcf_id is required", 400, null));
            }

            /* ================= PCF + PRODUCT + CATEGORY ================= */
            const pcfResult = await client.query(
                `
                SELECT
                    pcf.id AS pcf_id,
                    pcf.product_id,
                    pcf.product_name,
                    pcf.pcf_name,
                    pcf.version,
                    pcf.data_model,
                    pcf.calculation_method,
                    pcf.production_location,
                    pcf.functional_unit,
                    pcf.functional_unit_type,
                    pcf.reference_year,
                    pcf.validity_period,
                    pcf.description,
                    pcf.storage_duration,
                    pcf.created_date,

                    /* PRODUCT DETAILS */
                    p.id AS product_id,
                    p.product_code,
                    p.product_name,
                    p.product_category_id,
                    p.product_sub_category_id,

                    /* CATEGORY */
                    pc.code AS category_code,
                    pc.name AS category_name,

                    /* SUB CATEGORY */
                    sc.code AS sub_category_code,
                    sc.name AS sub_category_name

                FROM product_pcf pcf
                LEFT JOIN product p
                    ON pcf.product_id = p.id
                LEFT JOIN product_category pc
                    ON p.product_category_id = pc.id
                LEFT JOIN product_sub_category sc
                    ON p.product_sub_category_id = sc.id
                WHERE pcf.id = $1
                `,
                [pcf_id]
            );

            if (pcfResult.rowCount === 0) {
                return res.send(generateResponse(false, "PCF not found", 404, null));
            }

            const pcf = pcfResult.rows[0];

            /* ================= RAW MATERIAL COMPONENT ================= */
            const rawMaterial = await client.query(
                `SELECT *
                 FROM product_pcf_raw_material_component
                 WHERE product_id = $1
                 ORDER BY created_date`,
                [pcf.product_id]
            );

            /* ================= ENERGY CONSUMPTION ================= */
            const energy = await client.query(
                `SELECT *
                 FROM product_pcf_energy_consumption
                 WHERE product_id = $1`,
                [pcf.product_id]
            );

            /* ================= MANUFACTURING PROCESS ================= */
            const manufacturing = await client.query(
                `SELECT *
                 FROM product_pcf_manufacturing_process
                 WHERE product_id = $1`,
                [pcf.product_id]
            );

            /* ================= TRANSPORTATION ================= */
            const transportation = await client.query(
                `SELECT *
                 FROM product_pcf_transportation
                 WHERE product_id = $1
                 ORDER BY created_date`,
                [pcf.product_id]
            );

            /* ================= PACKAGING ================= */
            const packaging = await client.query(
                `SELECT *
                 FROM product_pcf_packaging
                 WHERE product_id = $1
                 ORDER BY created_date`,
                [pcf.product_id]
            );

            /* ================= FINAL RESPONSE ================= */
            const response = {
                product: {
                    id: pcf.product_id,
                    product_code: pcf.product_code,
                    product_name: pcf.product_name,
                    product_category_id: pcf.product_category_id,
                    product_sub_category_id: pcf.product_sub_category_id,
                    category_code: pcf.category_code,
                    category_name: pcf.category_name,
                    sub_category_code: pcf.sub_category_code,
                    sub_category_name: pcf.sub_category_name
                },
                product_pcf: {
                    id: pcf.pcf_id,
                    pcf_name: pcf.pcf_name,
                    version: pcf.version,
                    data_model: pcf.data_model,
                    calculation_method: pcf.calculation_method,
                    production_location: pcf.production_location,
                    functional_unit: pcf.functional_unit,
                    functional_unit_type: pcf.functional_unit_type,
                    reference_year: pcf.reference_year,
                    validity_period: pcf.validity_period,
                    description: pcf.description,
                    storage_duration: pcf.storage_duration,
                    created_date: pcf.created_date
                },
                product_pcf_raw_material_component: rawMaterial.rows,
                product_pcf_energy_consumption: energy.rows[0] || null,
                product_pcf_manufacturing_process: manufacturing.rows[0] || null,
                product_pcf_transportation: transportation.rows,
                product_pcf_packaging: packaging.rows
            };

            return res.send(generateResponse(true, "PCF details fetched successfully", 200, response));

        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}


export async function deleteRawMaterialComponents(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            await client.query("BEGIN");

            const { pprmc_ids } = req.body;

            if (!Array.isArray(pprmc_ids) || pprmc_ids.length === 0) {
                return res.send(generateResponse(false, "pprmc_ids are required", 400, null));
            }

            await client.query(
                `DELETE FROM product_pcf_raw_material_component
                 WHERE pprmc_id = ANY($1::varchar[])`,
                [pprmc_ids]
            );

            await client.query("COMMIT");
            return res.send(generateResponse(true, "Raw material components deleted", 200, null));

        } catch (error: any) {
            await client.query("ROLLBACK");
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function deleteTransportation(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            await client.query("BEGIN");

            const { ppt_ids } = req.body;

            if (!Array.isArray(ppt_ids) || ppt_ids.length === 0) {
                return res.send(generateResponse(false, "ppt_ids are required", 400, null));
            }

            await client.query(
                `DELETE FROM product_pcf_transportation
                 WHERE ppt_id = ANY($1::varchar[])`,
                [ppt_ids]
            );

            await client.query("COMMIT");
            return res.send(generateResponse(true, "Transportation records deleted", 200, null));

        } catch (error: any) {
            await client.query("ROLLBACK");
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function deletePackaging(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            await client.query("BEGIN");

            const { ppp_ids } = req.body;

            if (!Array.isArray(ppp_ids) || ppp_ids.length === 0) {
                return res.send(generateResponse(false, "ppp_ids are required", 400, null));
            }

            await client.query(
                `DELETE FROM product_pcf_packaging
                 WHERE ppp_id = ANY($1::varchar[])`,
                [ppp_ids]
            );

            await client.query("COMMIT");
            return res.send(generateResponse(true, "Packaging records deleted", 200, null));

        } catch (error: any) {
            await client.query("ROLLBACK");
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

