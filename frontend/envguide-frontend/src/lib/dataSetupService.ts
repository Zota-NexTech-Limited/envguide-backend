import authService from "./authService";
import { getApiBaseUrl } from "./apiBaseUrl";

const API_BASE_URL = getApiBaseUrl();

// Entity-specific field configuration for entities that don't follow standard (code, name, description) structure
export interface EntityFieldConfig {
  idField?: string; // ID field name (default: "id")
  fields: {
    key: string;
    label: string;
    required?: boolean;
    type?: "text" | "number" | "textarea";
  }[];
  foreignKey?: {
    field: string;
    displayName: string;
    entityType: string; // For dropdown loading
  };
}

export const entityFieldConfigs: Partial<Record<string, EntityFieldConfig>> = {
  manufacturer: {
    fields: [
      { key: "code", label: "Code", required: true },
      { key: "name", label: "Name", required: true },
      { key: "address", label: "Address", type: "textarea" },
      { key: "lat", label: "Latitude", type: "number" },
      { key: "long", label: "Longitude", type: "number" },
    ],
  },
  "vehicle-detail": {
    fields: [
      { key: "code", label: "Code", required: true },
      { key: "name", label: "Name", required: true },
      { key: "make", label: "Make" },
      { key: "model", label: "Model" },
      { key: "year", label: "Year" },
      { key: "number", label: "Number" },
    ],
  },
};

export function getEntityFieldConfig(entity: string): EntityFieldConfig | null {
  return entityFieldConfigs[entity] || null;
}

export type SetupEntity =
  | "product-type"
  | "product-category"
  | "product-sub-category"
  | "component-type"
  | "component-category"
  | "industry"
  | "manufacturer"
  | "allocation-method"
  | "aluminium-type"
  | "calculation-method"
  | "category"
  | "certificate-type"
  | "country-iso-three"
  | "country-iso-two"
  | "credit-method"
  | "discharge-destination"
  | "ef-unit"
  | "electricity-location-based"
  | "electricity-market-based"
  | "energy-source"
  | "energy-type"
  | "energy-unit"
  | "fuel-combustion"
  | "fuel-type"
  | "fugitive-emission"
  | "gaseous-fuel-unit"
  | "iron-type"
  | "life-cycle-boundary"
  | "life-cycle-stage"
  | "liquid-fuel-unit"
  | "magnesium-type"
  | "manufacturing-process"
  | "material-composition-metal"
  | "material-type"
  | "method-type"
  | "packaging-level"
  | "process-emission"
  | "process-specific-energy"
  | "product-unit"
  | "refrigerent-type"
  | "reporting-standard"
  | "scope-two-method"
  | "silicon-type"
  | "solid-fuel-unit"
  | "steam-heat-cooling"
  | "supplier-tier"
  | "tag"
  | "time-zone"
  | "transport-mode"
  | "transport-modes"
  | "transport-routes"
  | "vehicle-detail"
  | "vehicle-type"
  | "verification-status"
  | "waste-treatment"
  | "water-source"
  | "water-treatment"
  | "water-unit";

export interface SetupItem {
  id?: string;
  code: string;
  name: string;
  description?: string;
  // Entity-specific fields
  address?: string;
  lat?: number;
  long?: number;
  make?: string;
  model?: string;
  year?: string;
  number?: string;
  mcm_id?: string;
  mcm_name?: string; // Display name for composition metal
  [key: string]: any; // Allow dynamic fields
}

function getAuthHeaders() {
  const token = authService.getToken();
  return {
    "Content-Type": "application/json",
    Authorization: token || "",
  } as Record<string, string>;
}

function endpoint(
  entity: SetupEntity,
  action: "list" | "add" | "update" | "delete"
) {
  return `${API_BASE_URL}/api/data-setup/${entity}/${action}`;
}

// Extract ID from an item based on entity config
function extractId(entity: SetupEntity, item: any): string {
  const config = entityFieldConfigs[entity];
  if (config?.idField) {
    return item[config.idField]?.toString() || item.id?.toString() || "";
  }
  return item.id?.toString() || item._id?.toString() || "";
}

// Normalize item from API response
function normalizeItem(entity: SetupEntity, item: any): SetupItem {
  const id = extractId(entity, item);

  // For entities with non-standard fields, create a description for display
  let description = item.description ?? "";
  let code = item.code ?? "";
  let name = item.name ?? "";

  if (entity === "manufacturer") {
    // Use address as description for manufacturer
    description = item.address || "";
  } else if (entity === "vehicle-detail") {
    // Combine make, model, year, number for vehicle-detail description
    const parts = [];
    if (item.make) parts.push(`Make: ${item.make}`);
    if (item.model) parts.push(`Model: ${item.model}`);
    if (item.year) parts.push(`Year: ${item.year}`);
    if (item.number) parts.push(`Number: ${item.number}`);
    description = parts.join(", ") || "";
  }

  return {
    ...item,
    id,
    code,
    name,
    description,
  };
}

export async function listSetup(
  entity: SetupEntity,
  params?: { searchValue?: string }
): Promise<SetupItem[]> {
  const url = new URL(endpoint(entity, "list"));
  if (params?.searchValue)
    url.searchParams.set("searchValue", params.searchValue);
  const res = await fetch(url.toString(), {
    method: "GET",
    headers: getAuthHeaders(),
  });
  const data = await res.json();

  const normalize = (item: any) => normalizeItem(entity, item);

  // Expected: { status, message, code, data: { totalCount, list: [] } }
  if (Array.isArray((data as any)?.data?.list))
    return ((data as any).data.list as any[]).map(normalize);
  // Fallbacks
  if (Array.isArray(data)) return (data as any[]).map(normalize);
  if (Array.isArray((data as any)?.data))
    return ((data as any).data as any[]).map(normalize);
  if (Array.isArray((data as any)?.items))
    return ((data as any).items as any[]).map(normalize);
  return [];
}

// Build payload based on entity configuration
function buildPayload(entity: SetupEntity, item: SetupItem, includeId?: string): Record<string, any> {
  const config = entityFieldConfigs[entity];

  // Special handling for entities that use standard UI but different API fields
  if (entity === "manufacturer") {
    const payload: Record<string, any> = {
      code: item.code,
      name: item.name,
      address: item.description ?? item.address ?? "", // Map description to address
      lat: item.lat ?? 0,
      long: item.long ?? 0,
    };
    if (includeId) {
      payload.id = includeId;
    }
    return payload;
  }

  if (entity === "vehicle-detail") {
    // Parse the combined description back to individual fields if needed
    const payload: Record<string, any> = {
      code: item.code,
      name: item.name,
      make: item.make ?? "",
      model: item.model ?? "",
      year: item.year ?? "",
      number: item.number ?? "",
    };

    // If description is provided but individual fields aren't, try to parse
    if (item.description && !item.make && !item.model && !item.year && !item.number) {
      // Description format: "Make: X, Model: Y, Year: Z, Number: W"
      const desc = item.description;
      const makeMatch = desc.match(/Make:\s*([^,]+)/i);
      const modelMatch = desc.match(/Model:\s*([^,]+)/i);
      const yearMatch = desc.match(/Year:\s*([^,]+)/i);
      const numberMatch = desc.match(/Number:\s*([^,]+)/i);

      if (makeMatch) payload.make = makeMatch[1].trim();
      if (modelMatch) payload.model = modelMatch[1].trim();
      if (yearMatch) payload.year = yearMatch[1].trim();
      if (numberMatch) payload.number = numberMatch[1].trim();
    }

    if (includeId) {
      payload.id = includeId;
    }
    return payload;
  }

  // If entity has custom config, build payload from configured fields
  if (config) {
    const payload: Record<string, any> = {};

    // Add ID if provided
    if (includeId) {
      payload[config.idField || "id"] = includeId;
    }

    // Add foreign key if exists
    if (config.foreignKey && item[config.foreignKey.field]) {
      payload[config.foreignKey.field] = item[config.foreignKey.field];
    }

    // Add all configured fields
    config.fields.forEach((field) => {
      const value = item[field.key as keyof SetupItem];
      if (value !== undefined && value !== null) {
        payload[field.key] = field.type === "number" ? Number(value) : value;
      } else if (field.key !== "code" && field.key !== "name") {
        // Set defaults for non-required fields
        payload[field.key] = field.type === "number" ? 0 : "";
      } else {
        payload[field.key] = value ?? "";
      }
    });

    return payload;
  }

  // Default structure for standard entities
  const payload: Record<string, any> = {
    code: item.code,
    name: item.name,
    description: item.description ?? "",
  };

  if (includeId) {
    payload.id = includeId;
  }

  return payload;
}

export async function addSetup(
  entity: SetupEntity,
  item: SetupItem
): Promise<{ success: boolean; message?: string }> {
  try {
    const payload = buildPayload(entity, item);

    const res = await fetch(endpoint(entity, "add"), {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    const success = !!(data?.success ?? data?.status);
    return {
      success,
      message: data?.message,
    };
  } catch (error) {
    return {
      success: false,
      message: "An error occurred while adding item",
    };
  }
}

export async function updateSetup(
  entity: SetupEntity,
  item: SetupItem & { id: string }
): Promise<{ success: boolean; message?: string }> {
  try {
    const payload = buildPayload(entity, item, item.id);

    const res = await fetch(endpoint(entity, "update"), {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify([payload]),
    });
    const data = await res.json();
    const success = !!(data?.success ?? data?.status);
    return {
      success,
      message: data?.message,
    };
  } catch (error) {
    return {
      success: false,
      message: "An error occurred while updating item",
    };
  }
}

export async function deleteSetup(
  entity: SetupEntity,
  id: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const config = entityFieldConfigs[entity];
    const idField = config?.idField || "id";

    const res = await fetch(endpoint(entity, "delete"), {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ [idField]: id }),
    });
    const data = await res.json();
    const success = !!(data?.success ?? data?.status);
    return {
      success,
      message: data?.message,
    };
  } catch (error) {
    return {
      success: false,
      message: "An error occurred while deleting item",
    };
  }
}

export async function bulkAddSetup(
  entity: SetupEntity,
  items: SetupItem[]
): Promise<{ success: boolean; message: string; addedCount?: number }> {
  try {
    const payloadItems = items.map((item) => buildPayload(entity, item));

    const res = await fetch(`${API_BASE_URL}/api/data-setup/${entity}/bulk/add`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payloadItems),
    });
    const data = await res.json();
    if (data?.success || data?.status) {
      return {
        success: true,
        message: data?.message || "Bulk import successful",
        addedCount: data?.data?.addedCount || items.length,
      };
    }
    return {
      success: false,
      message: data?.message || "Bulk import failed",
    };
  } catch (error) {
    return {
      success: false,
      message: "An error occurred during bulk import",
    };
  }
}

// Get dropdown list for foreign key lookups
export async function getSetupDropdown(
  entity: string
): Promise<{ id: string; name: string }[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/data-setup/${entity}/list`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    let items: any[] = [];

    if (Array.isArray(data?.data?.list)) {
      items = data.data.list;
    } else if (Array.isArray(data?.data)) {
      items = data.data;
    } else if (Array.isArray(data)) {
      items = data;
    }

    // Get the ID field name for this entity
    const config = entityFieldConfigs[entity as SetupEntity];
    const idField = config?.idField || "id";

    return items.map((item: any) => ({
      id: item[idField]?.toString() || item.id?.toString() || "",
      name: item.name || "",
    }));
  } catch (error) {
    return [];
  }
}
