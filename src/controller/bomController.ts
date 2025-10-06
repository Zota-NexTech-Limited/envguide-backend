import { withClient } from '../util/database';
import { ulid } from 'ulid';
import { generateResponse } from '../util/genRes';
import { bomService } from "../services/bomService";

export async function createBOMWithDetails(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            await client.query("BEGIN");

            const {
                bom,
                bom_emission_tansport_value_calculation,
                bom_material_composition_emission_value,
                bom_emission_material_value_calculation,
                bom_supplier_co_product_information,
                allocation_methodology
            } = req.body;

            // Insert into BOM (Parent)
            const bomId = ulid();
            const bomCode = `BOM-${Date.now()}`;
            const created_by = req.user_id;

            const bomData = {
                id: bomId,
                code: bomCode,
                created_by: created_by,
                ...bom
            };

            await bomService.insertBOM(client, bomData);

            // Insert into bom_emission_tansport_value_calculation
            if (Array.isArray(bom_emission_tansport_value_calculation)) {
                for (const transport of bom_emission_tansport_value_calculation) {
                    await bomService.insertTransportValue(client, {
                        id: ulid(),
                        bom_id: bomId,
                        ...transport
                    });
                }
            }

            // Insert into bom_material_composition_emission_value
            if (Array.isArray(bom_material_composition_emission_value)) {
                for (const material of bom_material_composition_emission_value) {
                    await bomService.insertMaterialComposition(client, {
                        id: ulid(),
                        bom_id: bomId,
                        ...material
                    });
                }
            }

            // Insert into bom_emission_material_value_calculation
            if (bom_emission_material_value_calculation) {
                await bomService.insertMaterialValue(client, {
                    id: ulid(),
                    bom_id: bomId,
                    ...bom_emission_material_value_calculation
                });
            }

            // Insert into bom_supplier_co_product_information
            if (Array.isArray(bom_supplier_co_product_information)) {
                for (const supplier of bom_supplier_co_product_information) {
                    await bomService.insertSupplierCoProduct(client, {
                        id: ulid(),
                        bom_id: bomId,
                        ...supplier
                    });
                }
            }

            //Insert into allocation_methodology
            if (Array.isArray(allocation_methodology)) {
                for (const alloc of allocation_methodology) {
                    await bomService.insertAllocationMethod(client, {
                        id: ulid(),
                        bom_id: bomId,
                        ...alloc
                    });
                }
            }

            await client.query("COMMIT");

            return res.status(201).send(
                generateResponse(true, "BOM and related data created successfully", 201, {
                    bom_id: bomId,
                    code: bomCode
                })
            );

        } catch (error: any) {
            await client.query("ROLLBACK");
            console.error("Error creating BOM:", error);
            return res.status(500).json({
                success: false,
                message: error.message || "Failed to create BOM data"
            });
        }
    });
}

export async function updateBOMWithDetails(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            await client.query("BEGIN");

            const {
                bom,
                bom_emission_tansport_value_calculation,
                bom_material_composition_emission_value,
                bom_emission_material_value_calculation,
                bom_supplier_co_product_information,
                allocation_methodology
            } = req.body;

            const updated_by = req.user_id;
            bom.updated_by = updated_by;

            // Update Parent BOM using ID
            if (!bom?.id) {
                return res.status(400).json({ success: false, message: "Missing bom.id for update" });
            }

            await bomService.updateBOM(client, bom);

            const bomId = bom.id;

            //  Update bom_emission_tansport_value_calculation
            if (Array.isArray(bom_emission_tansport_value_calculation)) {
                for (const transport of bom_emission_tansport_value_calculation) {
                    if (transport.id && transport.bom_id) {
                        await bomService.updateTransportValue(client, transport);
                    }
                }
            }

            //  Update bom_material_composition_emission_value
            if (Array.isArray(bom_material_composition_emission_value)) {
                for (const material of bom_material_composition_emission_value) {
                    if (material.id && material.bom_id) {
                        await bomService.updateMaterialComposition(client, material);
                    }
                }
            }

            // Update bom_emission_material_value_calculation
            if (bom_emission_material_value_calculation?.id && bom_emission_material_value_calculation?.bom_id) {
                await bomService.updateMaterialValue(client, bom_emission_material_value_calculation);
            }

            //  Update bom_supplier_co_product_information
            if (Array.isArray(bom_supplier_co_product_information)) {
                for (const supplier of bom_supplier_co_product_information) {
                    if (supplier.id && supplier.bom_id) {
                        await bomService.updateSupplierCoProduct(client, supplier);
                    }
                }
            }

            //  Update allocation_methodology
            if (Array.isArray(allocation_methodology)) {
                for (const alloc of allocation_methodology) {
                    if (alloc.id && alloc.bom_id) {
                        await bomService.updateAllocationMethod(client, alloc);
                    }
                }
            }

            await client.query("COMMIT");

            return res.status(200).send(
                generateResponse(true, "BOM and related data updated successfully", 200, {
                    bom_id: bomId
                })
            );

        } catch (error: any) {
            await client.query("ROLLBACK");
            console.error("Error updating BOM:", error);
            return res.status(500).json({
                success: false,
                message: error.message || "Failed to update BOM data"
            });
        }
    });
}

export async function getBOMWithDetails(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { bom_id } = req.query;
            if (!bom_id) {
                return res.status(400).json({ success: false, message: "Missing bom_id" });
            }

            const bomData = await bomService.getFullBOMDetails(client, bom_id);

            if (!bomData) {
                return res.status(404).json({ success: false, message: "BOM not found" });
            }

            return res.status(200).send(
                generateResponse(true, "BOM fetched successfully", 200, bomData)
            );
        } catch (error: any) {
            console.error("Error fetching BOM details:", error);
            return res.status(500).json({
                success: false,
                message: error.message || "Failed to fetch BOM details"
            });
        }
    })
}