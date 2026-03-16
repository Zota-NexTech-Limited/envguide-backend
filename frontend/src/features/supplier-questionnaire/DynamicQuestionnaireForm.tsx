import React, { useState, useEffect, useCallback } from 'react';
import dayjs from 'dayjs';
import { Form, Input, Select, Checkbox, Radio, InputNumber, Button, Table, Space, Typography, Tooltip, Badge, Empty, Tag, Spin, Upload, message, DatePicker } from 'antd';
import type { UploadFile, UploadProps } from 'antd';
import { QUESTIONNAIRE_OPTIONS } from '../../config/questionnaireConfig';
import { PlusOutlined, DeleteOutlined, UploadOutlined, QuestionCircleOutlined, CheckCircleOutlined, InfoCircleOutlined, LoadingOutlined, FileOutlined } from '@ant-design/icons';
import type { QuestionnaireSection, QuestionnaireField, ApiDropdownType } from '../../config/questionnaireSchema';
import questionnaireDropdownService, { type DropdownItem } from '../../lib/questionnaireDropdownService';
import supplierQuestionnaireService from '../../lib/supplierQuestionnaireService';

const { Title, Text } = Typography;
const { TextArea } = Input;

// TagsInput component for pill-based multi-input
interface TagsInputProps {
  placeholder?: string;
  form: any;
  fieldName: string;
  value?: string[];
  onChange?: (value: string[]) => void;
}

const TagsInput: React.FC<TagsInputProps> = ({ placeholder, form, fieldName, value = [], onChange }) => {
  const [inputValue, setInputValue] = useState('');

  // Get current tags from form or prop
  const rawTags = value || form.getFieldValue(fieldName.split('.'));
  const tags = Array.isArray(rawTags) ? rawTags : [];

  const handleAddTag = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !tags.includes(trimmed)) {
      const newTags = [...tags, trimmed];
      if (onChange) {
        onChange(newTags);
      } else {
        form.setFieldValue(fieldName.split('.'), newTags);
      }
      setInputValue('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = tags.filter((tag: string) => tag !== tagToRemove);
    if (onChange) {
      onChange(newTags);
    } else {
      form.setFieldValue(fieldName.split('.'), newTags);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <div className="w-full">
      {/* Pills display */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((tag: string, index: number) => (
            <Tag
              key={index}
              closable
              onClose={() => handleRemoveTag(tag)}
              className="px-3 py-1 text-sm bg-indigo-50 text-indigo-700 border-indigo-200"
            >
              {tag}
            </Tag>
          ))}
        </div>
      )}
      {/* Input field */}
      <Space.Compact style={{ width: '100%' }}>
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          style={{ flex: 1 }}
        />
        <Button type="primary" onClick={handleAddTag} className="!bg-indigo-600 hover:!bg-indigo-700">
          Add
        </Button>
      </Space.Compact>
    </div>
  );
};

interface DynamicQuestionnaireFormProps {
  section: QuestionnaireSection;
  initialValues: any;
  onFinish: (values: any) => void;
  form: any; // Ant Form instance
  onValuesChange?: (changedValues: any, allValues: any) => void;
  autoPopulatedFields?: Set<string>;
  formErrors?: Record<string, string[]>;
  isClientMode?: boolean; // Client mode uses Product Code/Name instead of MPN/Component Name
}

// Type for storing dropdown data
type DropdownDataMap = Record<ApiDropdownType, DropdownItem[]>;

// Type for dependent dropdown data (keyed by parent value)
type DependentDropdownMap = Record<string, DropdownItem[]>;

const DynamicQuestionnaireForm: React.FC<DynamicQuestionnaireFormProps> = ({
  section,
  initialValues,
  onFinish,
  form,
  onValuesChange,
  autoPopulatedFields = new Set(),
  formErrors = {},
  isClientMode = false
}) => {
  const [charCounts, setCharCounts] = useState<Record<string, number>>({});

  // State for API dropdown data
  const [dropdownData, setDropdownData] = useState<Partial<DropdownDataMap>>({});
  const [dropdownLoading, setDropdownLoading] = useState<Record<string, boolean>>({});

  // State for dependent/cascading dropdowns (sub-fuel types by fuel type, energy types by source)
  const [subFuelTypesByFuel, setSubFuelTypesByFuel] = useState<DependentDropdownMap>({});
  const [energyTypesBySource, setEnergyTypesBySource] = useState<DependentDropdownMap>({});

  // Sync initialValues when they change (for auto-population)
  // This is important for Form.List components that need to be updated when data is auto-populated
  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      // Only update if there are actual values to set
      const currentValues = form.getFieldsValue();
      const hasNewData = JSON.stringify(currentValues) !== JSON.stringify(initialValues);
      
      if (hasNewData) {
        console.log("DynamicQuestionnaireForm: Updating form values from initialValues", initialValues);
        form.setFieldsValue(initialValues);
      }
    }
  }, [initialValues, form]);

  // Track character counts for textareas
  useEffect(() => {
    if (!section) return;
    const fields = section.fields.filter(f => f.type === 'textarea');
    const counts: Record<string, number> = {};
    fields.forEach(field => {
      const value = form.getFieldValue(field.name.split('.'));
      if (value) {
        counts[field.name] = value.length;
      }
    });
    setCharCounts(counts);
  }, [section, form]);

  // Auto-populate tables with products_manufactured data
  const autoPopulateTables = useCallback((forceFieldName?: string) => {
    if (!section) return;

    // Get products_manufactured from form
    const productsManufacturedRaw = form.getFieldValue(['product_details', 'products_manufactured']);
    // Filter out undefined/null items to prevent errors when accessing properties
    const productsManufactured = Array.isArray(productsManufacturedRaw) ? productsManufacturedRaw.filter(Boolean) : [];

    if (productsManufactured.length === 0) return;

    // Find tables that need auto-population
    const tablesNeedingAutoPopulate = section.fields.filter(
      (field) => field.type === 'table' && field.autoPopulateFromProducts
    );

    tablesNeedingAutoPopulate.forEach((field) => {
      const fieldPath = field.name.split('.');
      const currentValues = form.getFieldValue(fieldPath) || [];

      // Only auto-populate if table is empty
      // For forced fields (conditional tables that just became visible), still only populate if empty
      const isForced = forceFieldName === field.name;
      const isEmpty = currentValues.length === 0;

      // Auto-populate ONLY if table is empty (forced flag just prioritizes this field but doesn't override existing data)
      if (isEmpty) {
        const autoPopulatedRows = productsManufactured.map((product: any) => {
          const row: Record<string, any> = {};

          // Set material_number/MPN from product (use material_number which matches bomMaterials dropdown ID)
          const materialNumber = product.material_number || product.mpn || '';
          if (materialNumber) {
            row.material_number = materialNumber;
            row.mpn = materialNumber; // For backward compatibility
          }

          // Set component_name or product_name from product
          const productName = product.product_name || '';
          if (productName) {
            row.component_name = productName;
            row.product_name = productName;
          }

          // Set bom_id if available
          if (product.bom_id) {
            row.bom_id = product.bom_id;
          }

          return row;
        }).filter((row: Record<string, any>) => row.material_number || row.mpn || row.product_name); // Include rows with MPN or product_name

        if (autoPopulatedRows.length > 0) {
          console.log(`Auto-populating ${field.name} with ${autoPopulatedRows.length} products`);
          form.setFieldValue(fieldPath, autoPopulatedRows);
        }
      }
    });
  }, [section, form]);

  // Run auto-populate on section load
  useEffect(() => {
    autoPopulateTables();
  }, [autoPopulateTables, initialValues]);

  // Watch for dependency field changes to trigger auto-populate
  // This handles cases where conditional tables become visible
  useEffect(() => {
    if (!section) return;

    // Find all tables with autoPopulateFromProducts that have dependencies
    const conditionalTables = section.fields.filter(
      (field) => field.type === 'table' && field.autoPopulateFromProducts && field.dependency
    );

    conditionalTables.forEach((field) => {
      if (field.dependency) {
        const dependencyFieldPath = field.dependency.field.split('.');
        const dependencyValue = form.getFieldValue(dependencyFieldPath);

        // If the dependency condition is met, try to auto-populate
        if (dependencyValue === field.dependency.value) {
          // Small delay to allow form to render the table
          setTimeout(() => {
            autoPopulateTables(field.name);
          }, 100);
        }
      }
    });
  }, [section, form, autoPopulateTables]);

  // Fetch API dropdown data when section changes
  useEffect(() => {
    if (!section) return;

    // Collect all unique apiDropdown types needed for this section
    const apiDropdownTypes = new Set<ApiDropdownType>();

    const collectApiDropdowns = (fields: QuestionnaireField[]) => {
      fields.forEach(field => {
        if (field.apiDropdown && !field.dependsOnField) {
          // Only fetch non-dependent dropdowns initially
          apiDropdownTypes.add(field.apiDropdown);
        }
        if (field.columns) {
          field.columns.forEach(col => {
            if (col.apiDropdown && !col.dependsOnField) {
              apiDropdownTypes.add(col.apiDropdown);
            }
          });
        }
      });
    };

    collectApiDropdowns(section.fields);

    // Fetch each dropdown type
    const fetchDropdowns = async () => {
      for (const dropdownType of apiDropdownTypes) {
        // Skip if already loaded
        if (dropdownData[dropdownType]) continue;

        setDropdownLoading(prev => ({ ...prev, [dropdownType]: true }));

        try {
          let data: DropdownItem[] = [];

          switch (dropdownType) {
            case 'fuelType':
              data = await questionnaireDropdownService.getFuelTypeDropdown();
              break;
            case 'subFuelType':
              data = await questionnaireDropdownService.getSubFuelTypeDropdown();
              break;
            case 'refrigerantType':
              data = await questionnaireDropdownService.getRefrigerantTypeDropdown();
              break;
            case 'energySource':
              data = await questionnaireDropdownService.getEnergySourceDropdown();
              break;
            case 'processSpecificEnergy':
              data = await questionnaireDropdownService.getProcessSpecificEnergyDropdown();
              break;
            case 'energyType':
              data = await questionnaireDropdownService.getEnergyTypeDropdown();
              break;
            case 'bomMaterials':
              // BOM materials are derived from form data (products_manufactured)
              // This is handled separately in renderSelectField
              data = [];
              break;
            case 'wasteType':
              data = await questionnaireDropdownService.getWasteTypeDropdown();
              break;
            case 'wasteTreatmentType':
              data = await questionnaireDropdownService.getWasteTreatmentTypeDropdown();
              break;
            case 'productUnit':
              data = await questionnaireDropdownService.getProductUnitDropdown();
              break;
            case 'transportMode':
              data = await questionnaireDropdownService.getTransportModeDropdown();
              break;
            // UOM dropdowns
            case 'liquidGaseousSolidWaterUnit':
              data = await questionnaireDropdownService.getLiquidGaseousSolidWaterUnitDropdown();
              break;
            case 'liquidGaseousSolidUnit':
              data = await questionnaireDropdownService.getLiquidGaseousSolidUnitDropdown();
              break;
            case 'gaseousFuelUnit':
              data = await questionnaireDropdownService.getGaseousFuelUnitDropdown();
              break;
            case 'energyUnit':
              data = await questionnaireDropdownService.getEnergyUnitDropdown();
              break;
            case 'qcEquipmentUnit':
              data = await questionnaireDropdownService.getQcEquipmentUnitDropdown();
              break;
            case 'liquidGaseousUnit':
              data = await questionnaireDropdownService.getLiquidGaseousUnitDropdown();
              break;
            case 'solidFuelUnit':
              data = await questionnaireDropdownService.getSolidFuelUnitDropdown();
              break;
            case 'liquidSolidUnit':
              data = await questionnaireDropdownService.getLiquidSolidUnitDropdown();
              break;
            case 'packingUnit':
              data = await questionnaireDropdownService.getPackingUnitDropdown();
              break;
            // Q52 and Q60 specific dropdowns
            case 'materialType':
              data = await questionnaireDropdownService.getMaterialTypeDropdown();
              break;
            case 'packingType':
              data = await questionnaireDropdownService.getPackingTypeDropdown();
              break;
            case 'packagingTreatmentType':
              data = await questionnaireDropdownService.getPackagingTreatmentTypeDropdown();
              break;
          }

          setDropdownData(prev => ({ ...prev, [dropdownType]: data }));
        } catch (error) {
          console.error(`Failed to fetch ${dropdownType} dropdown:`, error);
        } finally {
          setDropdownLoading(prev => ({ ...prev, [dropdownType]: false }));
        }
      }
    };

    fetchDropdowns();
  }, [section]);

  // Track in-flight requests to prevent duplicate calls
  const [pendingRequests, setPendingRequests] = useState<Set<string>>(new Set());

  // Helper to check if a value looks like a valid API ID (ULID format)
  // ULIDs are 26 characters, alphanumeric
  const isValidApiId = (value: string): boolean => {
    if (!value || typeof value !== 'string') return false;
    // ULID format: 26 alphanumeric characters
    // Also accept UUIDs and other ID formats that don't contain spaces
    return /^[A-Za-z0-9_-]{10,}$/.test(value) && !value.includes(' ');
  };

  // Function to fetch dependent dropdown data (sub-fuel by fuel, energy type by source)
  const fetchDependentDropdown = useCallback(async (
    dropdownType: 'subFuelTypeByFuel' | 'energyTypeBySource',
    parentId: string
  ) => {
    if (!parentId) return;

    // Validate that parentId is an actual API ID, not a display name
    if (!isValidApiId(parentId)) {
      console.warn(`Invalid API ID format for ${dropdownType}: "${parentId}" - skipping fetch`);
      return;
    }

    const cacheKey = `${dropdownType}_${parentId}`;

    // Check if already cached
    if (dropdownType === 'subFuelTypeByFuel' && subFuelTypesByFuel[parentId]) return;
    if (dropdownType === 'energyTypeBySource' && energyTypesBySource[parentId]) return;

    // Check if request is already in flight
    if (pendingRequests.has(cacheKey)) return;

    // Mark request as pending
    setPendingRequests(prev => new Set(prev).add(cacheKey));
    setDropdownLoading(prev => ({ ...prev, [cacheKey]: true }));

    try {
      let data: DropdownItem[] = [];

      if (dropdownType === 'subFuelTypeByFuel') {
        data = await questionnaireDropdownService.getSubFuelTypeByFuelTypeDropdown(parentId);
        setSubFuelTypesByFuel(prev => ({ ...prev, [parentId]: data }));
      } else if (dropdownType === 'energyTypeBySource') {
        data = await questionnaireDropdownService.getEnergyTypeBySourceDropdown(parentId);
        setEnergyTypesBySource(prev => ({ ...prev, [parentId]: data }));
      }
    } catch (error) {
      console.error(`Failed to fetch ${dropdownType} for ${parentId}:`, error);
    } finally {
      setDropdownLoading(prev => ({ ...prev, [cacheKey]: false }));
      setPendingRequests(prev => {
        const next = new Set(prev);
        next.delete(cacheKey);
        return next;
      });
    }
  }, [subFuelTypesByFuel, energyTypesBySource, pendingRequests]);

  // Helper to get dropdown options for a field
  const getDropdownItems = useCallback((
    apiDropdownType: ApiDropdownType,
    dependsOnField?: string,
    parentValue?: string
  ): DropdownItem[] => {
    // Handle dependent dropdowns
    if (dependsOnField && parentValue) {
      // Only return cached data if parentValue is a valid API ID
      if (!isValidApiId(parentValue)) {
        return [];
      }
      if (apiDropdownType === 'subFuelTypeByFuel') {
        return subFuelTypesByFuel[parentValue] || [];
      }
      if (apiDropdownType === 'energyTypeBySource') {
        return energyTypesBySource[parentValue] || [];
      }
    }

    // Return static dropdown data
    return dropdownData[apiDropdownType] || [];
  }, [dropdownData, subFuelTypesByFuel, energyTypesBySource]);

  if (!section) {
    return null;
  }
  
  const renderField = (field: QuestionnaireField) => {
    // Handle conditional rendering
    if (field.dependency) {
      return (
        <Form.Item
          noStyle
          shouldUpdate={(prevValues, currentValues) => {
            // Helper to get nested value
            const getValue = (obj: any, path: string) => {
              return path.split('.').reduce((acc, part) => acc && acc[part], obj);
            };
            
            const prev = getValue(prevValues, field.dependency!.field);
            const curr = getValue(currentValues, field.dependency!.field);
            return prev !== curr;
          }}
        >
          {({ getFieldValue }) => {
            const dependencyValue = getFieldValue(field.dependency!.field.split('.'));
            const expectedValue = field.dependency!.value;
            
            // Check if dependency field has been answered at all
            const isAnswered = dependencyValue !== undefined && 
                              dependencyValue !== null && 
                              dependencyValue !== '';
            
            // If dependency field hasn't been answered, don't show dependent field
            if (!isAnswered) {
              return null;
            }
            
            // Handle different value types
            if (typeof expectedValue === 'boolean') {
              // For boolean dependencies, convert dependencyValue to boolean for comparison
              const depBool = typeof dependencyValue === 'string' 
                ? (dependencyValue.toLowerCase() === 'yes' || dependencyValue.toLowerCase() === 'true')
                : Boolean(dependencyValue);
              if (depBool !== expectedValue) {
                return null;
              }
            } else if (Array.isArray(dependencyValue)) {
              // For array values (multi-select), check if expected value is in array
              if (!dependencyValue.includes(expectedValue)) {
                return null;
              }
            } else {
              // For string/number values, check exact match (case-insensitive for Yes/No)
              const depStr = String(dependencyValue).toLowerCase();
              const expStr = String(expectedValue).toLowerCase();
              if (depStr !== expStr) {
                return null;
              }
            }
            
            return renderFieldContent(field);
          }}
        </Form.Item>
      );
    }

    return renderFieldContent(field);
  };

  const renderFieldContent = (field: QuestionnaireField) => {
    if (field.type === 'info') {
      return (
        <div className={`mb-3 transition-all duration-200 ${field.className || ''}`} key={field.name}>
          {field.label && <h4 className="text-sm font-medium text-gray-900 mb-2">{field.label}</h4>}
          <div className="text-sm text-gray-600 whitespace-pre-line">{field.content}</div>
        </div>
      );
    }

    if (field.type === 'table') {
      return renderTableField(field);
    }

    const commonProps = {
      placeholder: field.placeholder,
      disabled: field.disabled,
      style: { width: '100%' }
    };

    const isAutoPopulated = autoPopulatedFields.has(field.name);
    const fieldErrors = formErrors[field.name] || [];

    let inputComponent;
    switch (field.type) {
      case 'text':
        inputComponent = (
          <Input 
            {...commonProps}
            suffix={isAutoPopulated && (
              <Tooltip title="Auto-populated from BOM data">
                <InfoCircleOutlined className="text-green-500" />
              </Tooltip>
            )}
          />
        );
        break;
      case 'textarea':
        inputComponent = (
          <div>
            <TextArea 
              {...commonProps} 
              rows={4}
              maxLength={field.maxLength}
              showCount={!!field.maxLength}
              onChange={(e) => {
                setCharCounts(prev => ({ ...prev, [field.name]: e.target.value.length }));
                // Clear error if user starts typing
                if (e.target.value && fieldErrors.length > 0) {
                  // Error will be cleared by form validation
                }
              }}
            />
            {field.maxLength && (
              <div className="text-xs text-gray-400 mt-1">
                {charCounts[field.name] || 0} / {field.maxLength} characters
              </div>
            )}
          </div>
        );
        break;
      case 'number':
        inputComponent = (
          <InputNumber 
            {...commonProps}
            style={{ width: '100%' }}
            min={field.min}
            max={field.max}
          />
        );
        break;
      case 'select':
        inputComponent = (
          <Select 
            {...commonProps} 
            mode={field.mode}
            showSearch={field.options && field.options.length > 5}
            filterOption={(input, option) =>
              (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
            }
          >
            {field.options?.map((opt: any) => {
              const label = typeof opt === 'string' ? opt : opt.label;
              const value = typeof opt === 'string' ? opt : opt.value;
              return <Select.Option key={value} value={value}>{label}</Select.Option>;
            })}
          </Select>
        );
        break;
      case 'checkbox':
        if (field.options) {
          // Multi-select checkbox group
          inputComponent = (
            <Checkbox.Group>
              <Space direction="vertical" size="small">
                {field.options.map((opt: any) => {
                  const label = typeof opt === 'string' ? opt : opt.label;
                  const value = typeof opt === 'string' ? opt : opt.value;
                  return (
                    <Checkbox key={value} value={value}>
                      {label}
                    </Checkbox>
                  );
                })}
              </Space>
            </Checkbox.Group>
          );
        } else {
          // Single checkbox (acknowledgement)
          inputComponent = (
            <Checkbox>
              {field.placeholder || 'I acknowledge'}
            </Checkbox>
          );
        }
        break;
      case 'radio':
        inputComponent = (
          <Radio.Group>
            <Space size="large">
              {field.options?.map((opt: any) => {
                const label = typeof opt === 'string' ? opt : opt.label;
                const value = typeof opt === 'string' ? opt : opt.value;
                return (
                  <Radio key={value} value={value}>
                    {label}
                  </Radio>
                );
              })}
            </Space>
          </Radio.Group>
        );
        break;
      case 'tags':
        // Pill-based multi-input for array of strings
        inputComponent = (
          <TagsInput
            placeholder={field.placeholder || 'Type and press Enter to add'}
            form={form}
            fieldName={field.name}
          />
        );
        break;
      case 'date':
        // Date picker with DD/MM/YYYY format, sends timestamp to backend
        inputComponent = (
          <DatePicker
            {...commonProps}
            format="DD/MM/YYYY"
            className="h-8"
            style={{ width: '100%' }}
          />
        );
        break;
      case 'file':
        const isMultipleFile = field.multiple === true;

        // Extract filename from file key
        const getFileNameFromKey = (key: string) => {
          if (!key) return '';
          const parts = key.split('/');
          const fileName = parts[parts.length - 1];
          // Remove the prefix (IMG-timestamp-uuid-)
          const match = fileName.match(/^[A-Z]+-\d+-[a-f0-9-]+-(.+)$/);
          return match ? match[1] : fileName;
        };

        // Return a Form.Item with shouldUpdate to ensure re-render on value change
        return (
          <Form.Item
            key={field.name}
            label={
              <div className="flex items-center gap-2">
                <span>{field.label}</span>
                {field.required && <span className="text-red-500">*</span>}
              </div>
            }
            required={field.required}
            className="mb-6"
            shouldUpdate={(prevValues, currentValues) => {
              const prevVal = field.name.split('.').reduce((acc, part) => acc && acc[part], prevValues);
              const currVal = field.name.split('.').reduce((acc, part) => acc && acc[part], currentValues);
              return prevVal !== currVal;
            }}
          >
            {() => {
              // Get current file keys inside the render function to ensure fresh values
              const currentFileValue = form.getFieldValue(field.name.split('.'));
              const currentFileKeys: string[] = Array.isArray(currentFileValue)
                ? currentFileValue
                : (currentFileValue ? [currentFileValue] : []);

              const fileUploadProps: UploadProps = {
                customRequest: async (options) => {
                  const { file, onSuccess, onError, onProgress } = options;
                  onProgress?.({ percent: 30 });

                  try {
                    const result = await supplierQuestionnaireService.uploadSupplierFile(file as File);
                    if (result.success && result.key) {
                      onProgress?.({ percent: 100 });
                      onSuccess?.({ url: result.url, key: result.key }, file as any);
                      message.success(`File uploaded successfully`);

                      // Store the file key in form - get fresh value to avoid race conditions
                      const existingKeys = form.getFieldValue(field.name.split('.')) || [];
                      let newValue: string | string[];
                      if (isMultipleFile) {
                        // For multiple files, add to array
                        const keysArray = Array.isArray(existingKeys) ? existingKeys : (existingKeys ? [existingKeys] : []);
                        newValue = [...keysArray, result.key];
                        form.setFieldsValue({
                          [field.name.split('.')[0]]: field.name.split('.').slice(1).reduceRight(
                            (acc, part, idx, arr) => idx === arr.length - 1
                              ? { [part]: newValue }
                              : { [part]: acc },
                            {} as any
                          ) || { [field.name.split('.').slice(-1)[0]]: newValue }
                        });
                        // Simpler approach - just set the value directly
                        form.setFieldValue(field.name.split('.'), newValue);
                      } else {
                        // For single file, replace
                        newValue = result.key;
                        form.setFieldValue(field.name.split('.'), newValue);
                      }

                      // Trigger onValuesChange to save to localStorage
                      if (onValuesChange) {
                        // Get current form values
                        const allValues = form.getFieldsValue();

                        // Manually merge the new file value into allValues
                        // because form.setFieldValue may not have updated synchronously
                        const fieldParts = field.name.split('.');
                        let target = allValues;
                        for (let i = 0; i < fieldParts.length - 1; i++) {
                          if (!target[fieldParts[i]]) {
                            target[fieldParts[i]] = {};
                          }
                          target = target[fieldParts[i]];
                        }
                        target[fieldParts[fieldParts.length - 1]] = newValue;

                        // Build the changed value object with proper nesting
                        const changedValues = fieldParts.reduceRight(
                          (acc, part, idx, arr) => idx === arr.length - 1
                            ? { [part]: newValue }
                            : { [part]: acc },
                          {} as any
                        );
                        onValuesChange(changedValues, allValues);
                      }
                    } else {
                      onError?.(new Error(result.message || 'Upload failed'));
                      message.error(result.message || 'Upload failed');
                    }
                  } catch (error: any) {
                    onError?.(error);
                    message.error('Upload failed');
                  }
                },
                maxCount: isMultipleFile ? undefined : 1,
                multiple: isMultipleFile,
                accept: '.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg',
                showUploadList: false,
              };

              // Remove a file from the array
              const handleRemoveFile = (keyToRemove: string) => {
                let newValue: string[] | undefined;
                if (isMultipleFile) {
                  const freshKeys = form.getFieldValue(field.name.split('.')) || [];
                  const keysArray = Array.isArray(freshKeys) ? freshKeys : (freshKeys ? [freshKeys] : []);
                  const updatedKeys = keysArray.filter((k: string) => k !== keyToRemove);
                  newValue = updatedKeys.length > 0 ? updatedKeys : undefined;
                  form.setFieldValue(field.name.split('.'), newValue);
                } else {
                  newValue = undefined;
                  form.setFieldValue(field.name.split('.'), newValue);
                }

                // Trigger onValuesChange to save to localStorage
                if (onValuesChange) {
                  // Get current form values
                  const allValues = form.getFieldsValue();

                  // Manually merge the removed file value into allValues
                  // because form.setFieldValue may not have updated synchronously
                  const fieldParts = field.name.split('.');
                  let target = allValues;
                  for (let i = 0; i < fieldParts.length - 1; i++) {
                    if (!target[fieldParts[i]]) {
                      target[fieldParts[i]] = {};
                    }
                    target = target[fieldParts[i]];
                  }
                  target[fieldParts[fieldParts.length - 1]] = newValue;

                  const changedValues = fieldParts.reduceRight(
                    (acc, part, idx, arr) => idx === arr.length - 1
                      ? { [part]: newValue }
                      : { [part]: acc },
                    {} as any
                  );
                  onValuesChange(changedValues, allValues);
                }
              };

              return (
                <div>
                  {currentFileKeys.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {currentFileKeys.map((fileKey, index) => (
                        <div key={fileKey || index} className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                          <FileOutlined className="text-green-600" />
                          <span className="flex-1 text-sm text-gray-700 truncate" title={getFileNameFromKey(fileKey)}>
                            {getFileNameFromKey(fileKey)}
                          </span>
                          <Button
                            type="text"
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleRemoveFile(fileKey)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  <Upload {...fileUploadProps}>
                    <Button icon={<UploadOutlined />} className="hover:border-green-400 hover:text-green-600">
                      {currentFileKeys.length > 0
                        ? (isMultipleFile ? 'Add More Files' : 'Replace File')
                        : 'Click to Upload'}
                    </Button>
                  </Upload>
                  {field.placeholder && (
                    <div className="text-xs text-gray-500 mt-2">{field.placeholder}</div>
                  )}
                  {isMultipleFile && (
                    <div className="text-xs text-gray-400 mt-1">You can upload multiple files</div>
                  )}
                </div>
              );
            }}
          </Form.Item>
        );
      default:
        inputComponent = <Input {...commonProps} />;
    }

    // For single checkbox (without options), use valuePropName="checked"
    const isSingleCheckbox = field.type === 'checkbox' && !field.options;

    // For date fields, convert string values to dayjs objects
    const getDateValueProps = field.type === 'date' ? {
      getValueProps: (value: any) => ({
        value: value ? (typeof value === 'string' || typeof value === 'number' ? dayjs(value) : value) : undefined,
      }),
    } : {};

    return (
      <Form.Item
        key={field.name}
        name={field.name.split('.')}
        valuePropName={isSingleCheckbox ? "checked" : undefined}
        {...getDateValueProps}
        label={
          <div className="flex items-center gap-2">
            <span>{field.label}</span>
            {field.required && <span className="text-red-500">*</span>}
            {field.placeholder && field.type !== 'checkbox' && (
              <Tooltip title={field.placeholder}>
                <QuestionCircleOutlined className="text-gray-400 text-xs" />
              </Tooltip>
            )}
            {isAutoPopulated && (
              <Tag color="green" icon={<InfoCircleOutlined />} className="text-xs">
                Auto-filled
              </Tag>
            )}
          </div>
        }
        rules={[
          { 
            required: field.required, 
            message: field.required 
              ? (() => {
                  const questionNumber = field.label?.match(/^\d+\./)?.[0] || '';
                  if (isSingleCheckbox) {
                    return questionNumber 
                      ? `Please check this box to acknowledge ${questionNumber.slice(0, -1)}`
                      : `This field is required. Please check the box to continue.`;
                  }
                  if (questionNumber) {
                    return `Please answer ${questionNumber.slice(0, -1)}. This field is required.`;
                  }
                  return `This field is required. Please provide a value.`;
                })()
              : undefined
          },
          // Email validation
          ...(field.name.toLowerCase().includes('email') || field.label?.toLowerCase().includes('e-mail') || field.label?.toLowerCase().includes('email') ? [{
            type: 'email' as const,
            message: 'Please enter a valid email address (e.g., name@example.com)'
          }] : []),
          // Number validation
          ...(field.type === 'number' && field.min !== undefined ? [{
            type: 'number' as const,
            min: field.min,
            message: `Please enter a value of at least ${field.min}`
          }] : []),
          ...(field.type === 'number' && field.max !== undefined ? [{
            type: 'number' as const,
            max: field.max,
            message: `Please enter a value that does not exceed ${field.max}`
          }] : []),
          // Text length validation
          ...(field.type === 'text' && field.maxLength ? [{
            max: field.maxLength,
            message: `Please limit your response to ${field.maxLength} characters or less`
          }] : [])
        ].filter(Boolean)}
        className={`mb-2 transition-all duration-200 ${fieldErrors.length > 0 ? 'animate-pulse' : ''}`}
        validateStatus={fieldErrors.length > 0 ? 'error' : isAutoPopulated ? 'success' : undefined}
        help={fieldErrors.length > 0 ? fieldErrors[0] : undefined}
        extra={isAutoPopulated && (
          <div className="text-xs text-green-600 mt-1">
            This field was automatically populated from your BOM data. You can modify it if needed.
          </div>
        )}
      >
        {inputComponent}
      </Form.Item>
    );
  };

  const renderTableField = (field: QuestionnaireField) => {
    const isAutoPopulated = autoPopulatedFields.has(field.name);
    
    return (
      <div 
        key={field.name} 
        className={`mb-3 border rounded-lg bg-gray-50 transition-all duration-200 ${
          isAutoPopulated ? 'border-green-200 bg-green-50' : 'border-gray-200'
        }`}
      >
        <div className="p-4 border-b border-gray-200 bg-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-medium text-gray-900">{field.label}</h4>
              {field.required && <span className="text-red-500">*</span>}
              {isAutoPopulated && (
                <Tag color="green" icon={<InfoCircleOutlined />} className="text-xs">
                  Auto-filled
                </Tag>
              )}
            </div>
            {field.placeholder && (
              <Tooltip title={field.placeholder}>
                <QuestionCircleOutlined className="text-gray-400 text-xs cursor-help" />
              </Tooltip>
            )}
          </div>
          {/* {isAutoPopulated && (
            <div className="text-xs text-green-600 mt-2">
              This table was automatically populated from your BOM data. You can modify or add more entries.
            </div>
          )} */}
        </div>
        
        <div className="p-4">
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => {
              // Watch for changes in tables with dependent dropdowns
              const fieldPath = field.name.split('.');
              const getNestedValue = (obj: any, path: string[]) => {
                return path.reduce((acc, key) => acc?.[key], obj);
              };
              const prevList = getNestedValue(prevValues, fieldPath) || [];
              const currList = getNestedValue(currentValues, fieldPath) || [];

              if (prevList.length !== currList.length) return true;

              // Check if any dependent field values changed
              const hasDependentColumns = field.columns?.some(c => c.dependsOnField);
              if (hasDependentColumns) {
                return prevList.some((prevRow: any, index: number) => {
                  const currRow = currList[index];
                  return field.columns?.some(col => {
                    if (col.dependsOnField) {
                      return prevRow?.[col.dependsOnField] !== currRow?.[col.dependsOnField];
                    }
                    return false;
                  });
                });
              }
              return false;
            }}
          >
            {() => (
          <Form.List
            name={field.name.split('.')}
            rules={field.required ? [
              {
                validator: async (_, value) => {
                  if (!value || value.length === 0) {
                    const questionNumber = field.label?.match(/^\d+\./)?.[0] || '';
                    return Promise.reject(
                      new Error(
                        questionNumber
                          ? `Please add at least one entry to ${questionNumber.slice(0, -1)}. This table is required.`
                          : 'Please add at least one entry to this table. This field is required.'
                      )
                    );
                  }
                  return Promise.resolve();
                }
              }
            ] : undefined}
          >
            {(fields, { add, remove }, { errors }) => {
              const fieldColumns = Array.isArray(field.columns) ? field.columns : [];
              const columns = [
                ...(fieldColumns.map((col, colIndex) => {
                  const isAutoPopulatedCol = isAutoPopulated && colIndex < 2; // First 2 columns typically auto-populated

                  // Check if this column has a dependent dropdown
                  const hasDependentDropdown = col.apiDropdown && col.dependsOnField;

                  // Check if this column's value is depended on by another column
                  const isDependedOn = fieldColumns.some(c => c.dependsOnField === col.name);

                  // Determine display label for client mode
                  let displayLabel = col.label;
                  if (isClientMode) {
                    if (col.name === 'mpn') {
                      displayLabel = 'Product Code';
                    } else if (col.name === 'component_name') {
                      displayLabel = 'Product Name';
                    }
                  }

                  return {
                    title: (
                      <div className="flex items-center gap-1">
                        <span>{displayLabel}</span>
                        {col.required && <span className="text-red-500">*</span>}
                        {col.apiDropdown && dropdownLoading[col.apiDropdown] && (
                          <LoadingOutlined className="text-blue-500 text-xs" />
                        )}
                      </div>
                    ),
                    dataIndex: col.name,
                    key: col.name,
                    width: col.type === 'number' ? 120 : undefined,
                    render: (_: any, fieldRecord: any) => {
                      const fieldPath = field.name.split('.');

                      // Handle dependent dropdown (e.g., sub_fuel_type depends on fuel_type)
                      if (hasDependentDropdown) {
                        const rowValues = form.getFieldValue([...fieldPath, fieldRecord.name]);
                        const parentValue = rowValues?.[col.dependsOnField!]; // Parent name value (for display check)
                        let parentId = rowValues?.[`${col.dependsOnField!}_id`]; // Parent ID (for API lookup)
                        const currentValue = rowValues?.[col.name];

                        // If parentId is missing but parentValue exists, look up the ID from parent dropdown options
                        if (!parentId && parentValue) {
                          // Determine parent dropdown type based on the dependent dropdown type
                          let parentDropdownType: ApiDropdownType | null = null;
                          if (col.apiDropdown === 'subFuelTypeByFuel') {
                            parentDropdownType = 'fuelType';
                          } else if (col.apiDropdown === 'energyTypeBySource') {
                            parentDropdownType = 'energySource';
                          }

                          if (parentDropdownType) {
                            const parentOptions = getDropdownItems(parentDropdownType);
                            // Try to find by name first, then by ID (in case parentValue is actually an ID)
                            const parentOpt = parentOptions.find(opt => opt.name === parentValue) ||
                                              parentOptions.find(opt => opt.id === parentValue);
                            if (parentOpt) {
                              parentId = parentOpt.id;
                              // Trigger fetch of dependent options if not already cached
                              if (col.apiDropdown === 'subFuelTypeByFuel' && !subFuelTypesByFuel[parentId]) {
                                fetchDependentDropdown('subFuelTypeByFuel', parentId);
                              } else if (col.apiDropdown === 'energyTypeBySource' && !energyTypesBySource[parentId]) {
                                fetchDependentDropdown('energyTypeBySource', parentId);
                              }
                            }
                          }
                        }

                        // Get cached dependent options using parent ID (fetched when parent was selected)
                        const dependentOptions = getDropdownItems(col.apiDropdown!, col.dependsOnField, parentId);
                        const isLoadingDependent = parentId ? dropdownLoading[`${col.apiDropdown}_${parentId}`] : false;

                        // Check if current value exists in options by name, if not clear it
                        const isValueValid = !currentValue || dependentOptions.some(opt => opt.name === currentValue);
                        if (!isValueValid && currentValue) {
                          // Clear invalid value asynchronously to avoid render issues
                          setTimeout(() => {
                            form.setFieldValue([...fieldPath, fieldRecord.name, col.name], null);
                            form.setFieldValue([...fieldPath, fieldRecord.name, `${col.name}_id`], null);
                          }, 0);
                        }

                        return (
                          <Form.Item
                            name={[fieldRecord.name, col.name]}
                            rules={[
                              {
                                required: col.required,
                                message: col.required
                                  ? `Please fill in "${col.label}" for this row. This field is required.`
                                  : undefined
                              }
                            ].filter(Boolean)}
                            className="mb-0"
                          >
                            <Select
                              placeholder={parentValue ? col.placeholder : `Select ${col.dependsOnField?.replace('_', ' ')} first`}
                              style={{ minWidth: 120, width: '100%' }}
                              mode={col.mode}
                              disabled={!parentValue}
                              loading={isLoadingDependent}
                              allowClear
                              showSearch={dependentOptions.length > 5}
                              filterOption={(input, option) =>
                                (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                              }
                              onChange={(value) => {
                                // Find selected option by name and store the ID separately
                                const selectedOption = dependentOptions.find((opt: DropdownItem) => opt.name === value);
                                if (selectedOption) {
                                  form.setFieldValue([...fieldPath, fieldRecord.name, `${col.name}_id`], selectedOption.id);
                                } else {
                                  form.setFieldValue([...fieldPath, fieldRecord.name, `${col.name}_id`], null);
                                }
                              }}
                            >
                              {dependentOptions.map((opt: DropdownItem) => (
                                <Select.Option key={opt.id} value={opt.name}>{opt.name}</Select.Option>
                              ))}
                            </Select>
                          </Form.Item>
                        );
                      }

                      // Handle API dropdown that other columns depend on (parent dropdown)
                      if (col.apiDropdown && isDependedOn) {
                        const apiOptions = getDropdownItems(col.apiDropdown);
                        const isLoadingApi = dropdownLoading[col.apiDropdown];

                        // Find dependent column to clear its value when this changes
                        const dependentCol = fieldColumns.find(c => c.dependsOnField === col.name);

                        return (
                          <Form.Item
                            name={[fieldRecord.name, col.name]}
                            rules={[
                              {
                                required: col.required,
                                message: col.required
                                  ? `Please fill in "${col.label}" for this row. This field is required.`
                                  : undefined
                              }
                            ].filter(Boolean)}
                            className="mb-0"
                          >
                            <Select
                              placeholder={col.placeholder}
                              style={{ minWidth: 120, width: '100%' }}
                              mode={col.mode}
                              loading={isLoadingApi}
                              showSearch={apiOptions.length > 5}
                              filterOption={(input, option) =>
                                (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                              }
                              onChange={(value) => {
                                // Find the selected option by name (since value is now name)
                                const selectedOption = apiOptions.find((opt: DropdownItem) => opt.name === value);
                                // Store the ID separately for fetching dependent options
                                if (selectedOption) {
                                  form.setFieldValue([...fieldPath, fieldRecord.name, `${col.name}_id`], selectedOption.id);
                                } else {
                                  form.setFieldValue([...fieldPath, fieldRecord.name, `${col.name}_id`], null);
                                }

                                // Clear dependent column value when parent changes
                                if (dependentCol) {
                                  const dependentFieldPath = [...fieldPath, fieldRecord.name, dependentCol.name];
                                  form.setFieldValue(dependentFieldPath, null);
                                  form.setFieldValue([...fieldPath, fieldRecord.name, `${dependentCol.name}_id`], null);
                                  // Force form to recognize the change
                                  form.setFields([{ name: dependentFieldPath, value: null, errors: [] }]);
                                }
                                // Trigger fetch of dependent options using the ID
                                if (dependentCol?.apiDropdown === 'subFuelTypeByFuel' && selectedOption) {
                                  fetchDependentDropdown('subFuelTypeByFuel', selectedOption.id);
                                } else if (dependentCol?.apiDropdown === 'energyTypeBySource' && selectedOption) {
                                  fetchDependentDropdown('energyTypeBySource', selectedOption.id);
                                }
                              }}
                            >
                              {apiOptions.map((opt: DropdownItem) => (
                                <Select.Option key={opt.id} value={opt.name}>{opt.name}</Select.Option>
                              ))}
                            </Select>
                          </Form.Item>
                        );
                      }

                      // Handle BOM Materials dropdown (derived from products_manufactured)
                      if (col.apiDropdown === 'bomMaterials') {
                        // Get products_manufactured data from form
                        const productsManufacturedRaw = form.getFieldValue(['product_details', 'products_manufactured']);
                        // Filter out undefined/null items to prevent errors when accessing properties
                        const productsManufactured = Array.isArray(productsManufacturedRaw) ? productsManufacturedRaw.filter(Boolean) : [];
                        const bomMaterialOptions: DropdownItem[] = productsManufactured.map((item: any) => ({
                          id: item.material_number || item.mpn || '',
                          name: `${item.material_number || item.mpn || ''} - ${item.product_name || ''}`,
                          bom_id: item.bom_id || '',
                          product_name: item.product_name || '',
                        })).filter((opt: DropdownItem) => opt.id);

                        return (
                          <Form.Item
                            name={[fieldRecord.name, col.name]}
                            rules={[
                              {
                                required: col.required,
                                message: col.required
                                  ? `Please fill in "${col.label}" for this row. This field is required.`
                                  : undefined
                              }
                            ].filter(Boolean)}
                            className="mb-0"
                          >
                            <Select
                              placeholder={col.placeholder}
                              style={{ minWidth: 150, width: '100%' }}
                              showSearch
                              filterOption={(input, option) =>
                                (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                              }
                              onChange={(value) => {
                                // Find the selected item to get the bom_id and product_name
                                const selectedItem = bomMaterialOptions.find((opt: any) => opt.id === value);
                                if (selectedItem) {
                                  // Set the bom_id in the row data
                                  if (selectedItem.bom_id) {
                                    form.setFieldValue([...fieldPath, fieldRecord.name, 'bom_id'], selectedItem.bom_id);
                                  }
                                  // Auto-fill component_name or product_name with the product name
                                  if (selectedItem.product_name) {
                                    // Try common field names for component/product name
                                    form.setFieldValue([...fieldPath, fieldRecord.name, 'component_name'], selectedItem.product_name);
                                    form.setFieldValue([...fieldPath, fieldRecord.name, 'product_name'], selectedItem.product_name);
                                  }
                                }
                              }}
                            >
                              {bomMaterialOptions.map((opt: any) => (
                                <Select.Option key={opt.id} value={opt.id}>{opt.name}</Select.Option>
                              ))}
                            </Select>
                          </Form.Item>
                        );
                      }

                      // Handle simple API dropdown (no dependencies)
                      if (col.apiDropdown && !hasDependentDropdown && !isDependedOn) {
                        const apiOptions = getDropdownItems(col.apiDropdown);
                        const isLoadingApi = dropdownLoading[col.apiDropdown];

                        // Get current value - might be ID (from localStorage/API) or name
                        const rowValues = form.getFieldValue([...fieldPath, fieldRecord.name]) || {};
                        const currentValue = rowValues[col.name];

                        // Check if currentValue is an ID (not found in names but found in IDs)
                        // If so, we need to display both ID and name options so the Select can match
                        const isValueAnId = currentValue && apiOptions.length > 0 &&
                                            !apiOptions.some(opt => opt.name === currentValue) &&
                                            apiOptions.some(opt => opt.id === currentValue);

                        return (
                          <Form.Item
                            name={[fieldRecord.name, col.name]}
                            rules={[
                              {
                                required: col.required,
                                message: col.required
                                  ? `Please fill in "${col.label}" for this row. This field is required.`
                                  : undefined
                              }
                            ].filter(Boolean)}
                            className="mb-0"
                          >
                            <Select
                              placeholder={col.placeholder}
                              style={{ minWidth: 120, width: '100%' }}
                              mode={col.mode}
                              loading={isLoadingApi}
                              showSearch={apiOptions.length > 5}
                              filterOption={(input, option) =>
                                (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                              }
                            >
                              {apiOptions.map((opt: DropdownItem) => (
                                <Select.Option key={opt.id} value={opt.name}>{opt.name}</Select.Option>
                              ))}
                              {/* If current value is an ID, add a hidden option to display it correctly */}
                              {isValueAnId && (() => {
                                const matchedOpt = apiOptions.find(opt => opt.id === currentValue);
                                return matchedOpt ? (
                                  <Select.Option key={`id-${matchedOpt.id}`} value={currentValue} style={{ display: 'none' }}>
                                    {matchedOpt.name}
                                  </Select.Option>
                                ) : null;
                              })()}
                            </Select>
                          </Form.Item>
                        );
                      }

                      // Default rendering for columns without API dropdown
                      // For date columns, add getValueProps to convert string values to dayjs objects
                      const dateValueProps = col.type === 'date' ? {
                        getValueProps: (value: any) => ({
                          value: value ? (typeof value === 'string' || typeof value === 'number' ? dayjs(value) : value) : undefined,
                        }),
                      } : {};

                      return (
                        <Form.Item
                          name={[fieldRecord.name, col.name]}
                          rules={[
                            {
                              required: col.required,
                              message: col.required
                                ? `Please fill in "${col.label}" for this row. This field is required.`
                                : undefined
                            },
                            ...(col.type === 'number' && col.min !== undefined ? [{
                              type: 'number' as const,
                              min: col.min,
                              message: `${col.label} must be at least ${col.min}`
                            }] : []),
                            ...(col.type === 'number' && col.max !== undefined ? [{
                              type: 'number' as const,
                              max: col.max,
                              message: `${col.label} must not exceed ${col.max}`
                            }] : [])
                          ].filter(Boolean)}
                          className="mb-0"
                          {...dateValueProps}
                        >
                          {col.type === 'select' ? (
                            <Select
                              placeholder={col.placeholder}
                              style={{ minWidth: 120, width: '100%' }}
                              mode={col.mode}
                              showSearch={col.options && col.options.length > 5}
                              filterOption={(input, option) =>
                                (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                              }
                            >
                              {col.options?.map((opt: any) => {
                                const label = typeof opt === 'string' ? opt : opt.label;
                                const value = typeof opt === 'string' ? opt : opt.value;
                                return <Select.Option key={value} value={value}>{label}</Select.Option>;
                              })}
                            </Select>
                          ) : col.type === 'number' ? (
                            <InputNumber
                              placeholder={col.placeholder}
                              style={{ width: '100%' }}
                              min={col.min}
                              max={col.max}
                            />
                          ) : col.type === 'date' ? (
                            <DatePicker
                              placeholder={col.placeholder}
                              format="DD/MM/YYYY"
                              className="h-8"
                              style={{ width: '100%' }}
                            />
                          ) : (
                            <Input
                              placeholder={col.placeholder}
                              className={isAutoPopulatedCol ? 'bg-green-50' : ''}
                            />
                          )}
                        </Form.Item>
                      );
                    }
                  };
                }) || []),
                {
                  title: 'Action',
                  key: 'action',
                  width: 70,
                  fixed: 'right' as const,
                  render: (_: any, fieldRecord: any) => (
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => remove(fieldRecord.name)}
                      className="hover:bg-red-50"
                      size="small"
                    />
                  )
                }
              ];

              return (
                <>
                  {fields.length === 0 ? (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={
                        <span className="text-gray-400">
                          No items added yet. Click the button below to add your first entry.
                        </span>
                      }
                      className="py-8"
                    />
                  ) : (
                    <div className="overflow-x-auto">
                      <Table
                        dataSource={fields}
                        columns={columns}
                        pagination={false}
                        rowKey="key"
                        size="small"
                        bordered
                        className="mb-4"
                        scroll={{ x: 'max-content' }}
                        rowClassName={(_, index) => 
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        }
                      />
                    </div>
                  )}
                  {errors.length > 0 && (
                    <div className="mt-2">
                      {errors.map((error, index) => (
                        <div key={index} className="text-sm text-red-600 flex items-center gap-1">
                          <InfoCircleOutlined className="text-xs" />
                          {error}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">
                      {fields.length} {fields.length === 1 ? 'item' : 'items'}
                      {field.required && fields.length === 0 && (
                        <span className="text-red-500 ml-1">(Required - add at least one entry)</span>
                      )}
                    </span>
                    <Button 
                      type="dashed" 
                      onClick={() => add()} 
                      icon={<PlusOutlined />}
                      className="hover:border-green-400 hover:text-green-600"
                    >
                      {field.addButtonLabel || 'Add Row'}
                    </Button>
                  </div>
                </>
              );
            }}
          </Form.List>
            )}
          </Form.Item>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-6">
      <div className="mb-6 sm:mb-8">
        <Title level={3} className="mb-2">{section.title}</Title>
        {section.description && (
          <Text type="secondary" className="text-sm">{section.description}</Text>
        )}
      </div>
      
      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues}
        onFinish={onFinish}
        onValuesChange={(changedValues, allValues) => {
          // Call parent's onValuesChange if provided
          onValuesChange?.(changedValues, allValues);

          // Check if any dependency field changed - trigger auto-populate for conditional tables
          if (section) {
            const conditionalTables = section.fields.filter(
              (field) => field.type === 'table' && field.autoPopulateFromProducts && field.dependency
            );

            conditionalTables.forEach((field) => {
              if (field.dependency) {
                const dependencyFieldPath = field.dependency.field;
                // Check if the changed value is the dependency field
                const changedPath = Object.keys(changedValues).join('.');
                if (dependencyFieldPath.includes(changedPath) || changedPath.includes(dependencyFieldPath.split('.')[0])) {
                  // Get the dependency value
                  const dependencyValue = form.getFieldValue(dependencyFieldPath.split('.'));
                  if (dependencyValue === field.dependency.value) {
                    // Trigger auto-populate after a small delay
                    setTimeout(() => {
                      autoPopulateTables(field.name);
                    }, 200);
                  }
                }
              }
            });
          }
        }}
        scrollToFirstError
        className="space-y-2"
      >
        {section.fields.map((field, index) => (
          <div 
            key={field.name} 
            className="transition-all duration-200 hover:bg-gray-50 -mx-2 px-2 rounded"
          >
            {renderField(field)}
          </div>
        ))}
      </Form>
    </div>
  );
};

export default DynamicQuestionnaireForm;
