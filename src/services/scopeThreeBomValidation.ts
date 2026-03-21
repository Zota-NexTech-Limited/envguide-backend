/**
 * Ensures Q52 / Q68 / Q74 rows that are saved reference a real BOM line on this PCF.
 * Called before persisting supplier questionnaire scope 3 data.
 */

function isFilledQ52(row: any): boolean {
  return !!(
    row &&
    row.material_name &&
    row.percentage !== undefined &&
    row.percentage !== null &&
    row.percentage !== ''
  );
}

function isFilledQ68(row: any): boolean {
  return !!(
    row &&
    row.waste_type &&
    row.waste_weight !== undefined &&
    row.waste_weight !== null &&
    row.waste_weight !== ''
  );
}

function isFilledQ74(row: any): boolean {
  return !!(
    row &&
    row.mode_of_transport &&
    row.source_point &&
    row.drop_point &&
    row.distance !== undefined &&
    row.distance !== null &&
    row.distance !== ''
  );
}

function scopeThreeHasAnyFilledBomRows(scopeThree: any): boolean {
  const scopes = Array.isArray(scopeThree) ? scopeThree : [scopeThree];
  for (const s of scopes) {
    if (!s) continue;
    if ((s.raw_materials_used_in_component_manufacturing_questions || []).some((r: any) => isFilledQ52(r)))
      return true;
    if ((s.weight_of_pro_packaging_waste_questions || []).some((r: any) => isFilledQ68(r))) return true;
    if ((s.mode_of_transport_used_for_transportation_questions || []).some((r: any) => isFilledQ74(r)))
      return true;
  }
  return false;
}

/**
 * @param sup_id When set, BOM rows are restricted to that supplier (supplier questionnaire).
 * When null/undefined, all BOM lines for the PCF are allowed (e.g. client / own-emission create).
 */
export async function assertScopeThreeBomRowsValid(
  client: any,
  bom_pcf_id: string,
  sup_id: string | null | undefined,
  scopeThree: any
): Promise<void> {
  if (!scopeThree || !bom_pcf_id) return;

  const bomRes = sup_id
    ? await client.query(
        `SELECT id FROM bom WHERE bom_pcf_id = $1 AND supplier_id = $2`,
        [bom_pcf_id, sup_id]
      )
    : await client.query(`SELECT id FROM bom WHERE bom_pcf_id = $1`, [bom_pcf_id]);
  const allowed = new Set<string>(bomRes.rows.map((r: { id: string }) => r.id));
  if (allowed.size === 0) {
    if (scopeThreeHasAnyFilledBomRows(scopeThree)) {
      throw new Error(
        'BOM lines must exist for this PCF before saving Scope 3 (Q52/Q68/Q74) answers. Add BOM lines first, then retry.'
      );
    }
    return;
  }

  const scopes = Array.isArray(scopeThree) ? scopeThree : [scopeThree];

  for (const s of scopes) {
    if (!s) continue;

    (s.raw_materials_used_in_component_manufacturing_questions || []).forEach(
      (row: any, i: number) => {
        if (!isFilledQ52(row)) return;
        if (!row.bom_id) {
          throw new Error(
            `Q52 (materials): row ${i + 1} must be linked to a component (MPN). Re-select MPN so bom_id is set.`
          );
        }
        if (!allowed.has(row.bom_id)) {
          throw new Error(
            `Q52 (materials): row ${i + 1} has a bom_id that is not on this PCF BOM.`
          );
        }
      }
    );

    (s.weight_of_pro_packaging_waste_questions || []).forEach((row: any, i: number) => {
      if (!isFilledQ68(row)) return;
      if (!row.bom_id) {
        throw new Error(
          `Q68 (waste): row ${i + 1} must be linked to a component (MPN). Re-select MPN so bom_id is set.`
        );
      }
      if (!allowed.has(row.bom_id)) {
        throw new Error(
          `Q68 (waste): row ${i + 1} has a bom_id that is not on this PCF BOM.`
        );
      }
    });

    (s.mode_of_transport_used_for_transportation_questions || []).forEach(
      (row: any, i: number) => {
        if (!isFilledQ74(row)) return;
        if (!row.bom_id) {
          throw new Error(
            `Q74 (transport): row ${i + 1} must be linked to a component (MPN). Re-select MPN so bom_id is set.`
          );
        }
        if (!allowed.has(row.bom_id)) {
          throw new Error(
            `Q74 (transport): row ${i + 1} has a bom_id that is not on this PCF BOM.`
          );
        }
      }
    );
  }
}
