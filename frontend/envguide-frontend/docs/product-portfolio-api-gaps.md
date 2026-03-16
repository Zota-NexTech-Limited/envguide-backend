# Product Portfolio - API Gaps Documentation

## API Endpoints

### List Products
**URL:** `https://enviguide.nextechltd.in/api/product/list`
**Method:** GET
**Query Parameters:** pageNumber, pageSize, start_date, end_date, category_name, pcf_status, sub_category_name, product_name, search

### Get Product by ID
**URL:** `https://enviguide.nextechltd.in/api/product/get-by-id`
**Method:** GET
**Query Parameters:** id

### Create Product
**URL:** `https://enviguide.nextechltd.in/api/product/add`
**Method:** POST

### Update Product
**URL:** `https://enviguide.nextechltd.in/api/product/update`
**Method:** POST

---

## Design Requirements vs API Response

### Table Columns Required (as per Design)

| Column Name | API Field | Status | Notes |
|-------------|-----------|--------|-------|
| Product Code | `product_code` | ✅ Available | Working correctly |
| Product Name | `product_name` | ✅ Available | Working correctly |
| PCF Status | `pcf_status` | ✅ Available | Working correctly |
| **No. of PCF** | **MISSING** | ❌ Not Available | **Backend needs to add this field** |
| Component Category | `category_name` | ✅ Available | Working correctly |
| Emission | `ed_estimated_pcf` | ✅ Available | Working correctly |
| **Last Update emission** | **MISSING** | ❌ Not Available | **Backend needs to add this field** |
| Created BY | `created_by_name` | ✅ Available | Working correctly |
| Created Date | `created_date` | ✅ Available | Working correctly |
| Updated BY | `updated_by_name` | ✅ Available | Working correctly |
| Updated Date | `update_date` | ✅ Available | Working correctly |
| Actions | N/A | ✅ Available | Frontend-rendered |

---

## Missing Fields

### 1. No. of PCF
- **Description:** Count of PCF (Product Carbon Footprint) records associated with this product
- **Expected Type:** Number/Integer
- **Expected Field Name Suggestion:** `pcf_count` or `no_of_pcf`
- **Priority:** High

### 2. Last Update emission
- **Description:** Timestamp of the last emission data update (separate from product record update)
- **Expected Type:** Date/Timestamp
- **Expected Field Name Suggestion:** `emission_last_updated` or `last_emission_update`
- **Priority:** High
- **Note:** This appears to be different from `update_date` which tracks the product record update, not emission-specific updates

---

## Current API Response Sample

```json
{
  "status": true,
  "message": "Fetched successfully",
  "code": 200,
  "data": [
    {
      "id": "01KADE43VDJRKCMGFTAPYK17M7",
      "product_code": "PRD-ST4502",
      "product_name": "Stainless Steel Support Bracket",
      "product_category_id": "01K5BCR7HENFM96RDRY02BG3YV",
      "product_sub_category_id": "01K5BCYA8PGXAZJZ24A407DKHP",
      "description": "Corrosion-resistant stainless steel bracket...",
      "ts_weight_kg": 1.25,
      "ts_dimensions": "200mm x 100mm x 80mm",
      "ts_material": "Stainless Steel 304",
      "ts_manufacturing_process_id": "01KADCT4NR0MBPT1NSB6QH69SP",
      "ts_supplier": "Prime Steel Industries",
      "ts_part_number": "PSI-SSB-304-4502",
      "ed_estimated_pcf": 8.4,
      "ed_recyclability": 10.25,
      "ed_life_cycle_stage_id": "01KADCW9E16D80VZJNC8FASSDR",
      "ed_renewable_energy": 9,
      "created_by": "01K8GVAT2BMR1FN2T4057JZ50V",
      "updated_by": "01K3K6DJX3NF3Y5SRW1630KS5E",
      "update_date": "2026-01-22T05:42:38.889Z",
      "created_date": "2025-11-19T06:51:37.982Z",
      "pcf_status": "Not Available",
      "category_code": "FUL002",
      "category_name": "Baterry Cell",
      "sub_category_code": null,
      "sub_category_name": null,
      "manufacturing_process_name": "Stamping",
      "life_cycle_stage_name": "Transportation & Distribution",
      "created_by_name": "sai pranay",
      "updated_by_name": "Abhiram"
    }
  ]
}
```

---

## Action Items for Backend Team

1. ✅ Add `pcf_count` or `no_of_pcf` field to the product list response
   - Should return the count of PCF records associated with each product

2. ✅ Add `emission_last_updated` or `last_emission_update` field to the product list response
   - Should return the timestamp of when emission data was last updated
   - This is separate from `update_date` which tracks product record updates

---

## Frontend Implementation Status

- ✅ Product Code, Product Name, PCF Status - Implemented
- ✅ Component Category, Emission - Implemented
- ✅ Created BY, Created Date - Implemented
- ✅ Updated BY, Updated Date - Implemented
- ⏳ No. of PCF - Waiting for backend field
- ⏳ Last Update emission - Waiting for backend field

---

**Document Created:** 2026-01-30
**Frontend Developer:** Claude Code
**For Backend Team:** Please add the missing fields listed above to the `/api/product/list` endpoint
