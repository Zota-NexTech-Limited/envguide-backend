import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import {
  Steps,
  Button,
  message,
  Spin,
  Modal,
  Form,
  Progress,
  Drawer,
  Badge,
  Tooltip,
  Alert,
  Input,
  Select,
  Row,
  Col,
  Divider,
} from "antd";
import {
  SaveOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CheckOutlined,
  MenuOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined,
  SmileOutlined,
} from "@ant-design/icons";
import supplierQuestionnaireService from "../../lib/supplierQuestionnaireService";
import authService from "../../lib/authService";
import productService from "../../lib/productService";
import userManagementService from "../../lib/userManagementService";
import type { SupplierOnboarding } from "../../types/userManagement";
import { QUESTIONNAIRE_SCHEMA } from "../../config/questionnaireSchema";
import DynamicQuestionnaireForm from "./DynamicQuestionnaireForm";

const { Step } = Steps;

const SupplierQuestionnaire: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm();

  // Get URL params
  let sgiq_id = searchParams.get("sgiq_id");
  let sup_id = searchParams.get("sup_id");
  let bom_pcf_id = searchParams.get("bom_pcf_id");
  let user_id = searchParams.get("user_id");
  // Client mode params
  let is_client = searchParams.get("is_client") === "true";
  let client_id = searchParams.get("client_id");
  let product_id = searchParams.get("product_id");

  if (location.search) {
    const urlParams = new URLSearchParams(location.search);
    sgiq_id = sgiq_id || urlParams.get("sgiq_id");
    sup_id = sup_id || urlParams.get("sup_id");
    bom_pcf_id = bom_pcf_id || urlParams.get("bom_pcf_id");
    user_id = user_id || urlParams.get("user_id");
    // Client mode params
    is_client = is_client || urlParams.get("is_client") === "true";
    client_id = client_id || urlParams.get("client_id");
    product_id = product_id || urlParams.get("product_id");
  }

  // Determine if this is client mode
  const isClientMode = !!(is_client && client_id && product_id && bom_pcf_id);

  const isViewMode = location.pathname.includes("/view");
  const isEditMode = location.pathname.includes("/edit");
  const isCreateMode =
    !sgiq_id &&
    (location.pathname.includes("/new") || (!isViewMode && !isEditMode));
  const isPublicRoute = !!(sup_id && bom_pcf_id); // Public route when accessed via supplier link

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [questionnaireId, setQuestionnaireId] = useState<string | null>(
    sgiq_id,
  );
  const [autoSaveStatus, setAutoSaveStatus] = useState<
    "idle" | "saving" | "saved"
  >("idle");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasCalledStageUpdateRef = useRef<boolean>(false);
  const [autoPopulatedFields, setAutoPopulatedFields] = useState<Set<string>>(
    new Set(),
  );
  const [isCompleted, setIsCompleted] = useState(false);

  // Supplier onboarding state
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(false);
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);
  const [showOnboardingForm, setShowOnboardingForm] = useState(false);
  const [onboardingForm] = Form.useForm();
  const [isSubmittingOnboarding, setIsSubmittingOnboarding] = useState(false);

  // Check supplier onboarding status first (only for supplier mode with sup_id)
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (sup_id && !isClientMode && isCreateMode) {
        setIsCheckingOnboarding(true);
        try {
          const result = await userManagementService.checkSupplierOnboardingStatus(sup_id);
          setIsOnboarded(result.isOnboarded);
          if (!result.isOnboarded) {
            setShowOnboardingForm(true);
            // Pre-fill form if we have partial data
            if (result.supplierData) {
              onboardingForm.setFieldsValue(result.supplierData);
            }
          }
        } catch (error) {
          console.error("Error checking onboarding status:", error);
          // If error, assume not onboarded and show form
          setIsOnboarded(false);
          setShowOnboardingForm(true);
        } finally {
          setIsCheckingOnboarding(false);
        }
      } else {
        // For non-supplier routes or client mode, skip onboarding check
        setIsOnboarded(true);
      }
    };

    checkOnboardingStatus();
  }, [sup_id, isClientMode, isCreateMode, onboardingForm]);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      // Wait for onboarding check to complete for supplier mode
      if (sup_id && !isClientMode && isCreateMode && isOnboarded === null) {
        return; // Wait for onboarding check
      }

      // If not onboarded, don't load questionnaire data yet
      if (showOnboardingForm) {
        return;
      }

      if ((isViewMode || isEditMode) && sgiq_id) {
        setIsLoading(true);
        try {
          let userIdToUse = user_id;
          if (!userIdToUse) {
            const user = authService.getCurrentUser();
            if (user?.id) userIdToUse = user.id;
          }

          if (sgiq_id) {
            const result =
              await supplierQuestionnaireService.getQuestionnaireById(
                sgiq_id as string,
                userIdToUse ?? "",
              );
            if (result.success && result.data) {
              setFormData(result.data);
              // We need to set form values if we are on the current step
              // But form values are set via initialValues prop on the DynamicForm
              // However, when switching steps, we need to ensure data is preserved
            } else {
              message.error({
                content:
                  result.message ||
                  "Unable to load the questionnaire. Please try refreshing the page or contact support if the issue persists.",
                duration: 5,
              });
            }
          }
        } catch (error) {
          console.error("Error loading questionnaire:", error);
          message.error({
            content:
              "Failed to load the questionnaire. Please check your internet connection and try again. If the problem persists, contact support.",
            duration: 5,
          });
        } finally {
          setIsLoading(false);
        }
      } else if (isCreateMode) {
        // Client mode auto-populate using product get-by-id API
        if (isClientMode && product_id) {
          setIsLoading(true);
          try {
            const result = await productService.getProductById(product_id);
            if (result.status && result.data) {
              console.log("Client mode - Product API response:", result.data);
              const productData = result.data;

              // Map product data to form structure
              // Use schema field names (mpn, component_name) but fill with product data
              // product_id is stored for backend, not shown in UI
              const productionSiteDetails = [
                {
                  product_id: productData.id, // Hidden, passed to backend
                  mpn: productData.product_code || "", // Shows as "Product Code" for client
                  component_name: productData.product_name || "", // Shows as "Product Name" for client
                  location: "", // To be filled by user
                },
              ];

              const productsManufactured = [
                {
                  product_id: productData.id, // Hidden, passed to backend
                  mpn: productData.product_code || "", // Shows as "Product Code" for client
                  product_name: productData.product_name || "", // Already named product_name in schema
                  production_period: "",
                  weight_per_unit: productData.ts_weight_kg || 0,
                  unit: "Kg",
                  price: 0,
                  quantity: 0,
                },
              ];

              const autoPopulatedData: any = {
                product_details: {
                  production_site_details: productionSiteDetails,
                  products_manufactured: productsManufactured,
                },
              };

              console.log("Client mode - Auto-populated data:", autoPopulatedData);

              // Merge with existing form data
              const mergedFormData = {
                ...formData,
                ...autoPopulatedData,
              };

              setFormData(mergedFormData);

              // Set form values
              setTimeout(() => {
                form.setFieldsValue(mergedFormData);
              }, 200);

              // Track auto-populated fields
              const autoPopulatedFieldNames = new Set<string>();
              autoPopulatedFieldNames.add("product_details.production_site_details");
              autoPopulatedFieldNames.add("product_details.products_manufactured");
              setAutoPopulatedFields(autoPopulatedFieldNames);

              message.success({
                content: `Successfully auto-populated product details for ${productData.product_name}.`,
                duration: 3,
              });
            } else {
              console.warn("Client mode - Failed to fetch product:", result);
              message.warning({
                content: "Could not fetch product details. Please fill them in manually.",
                duration: 4,
              });
            }
          } catch (error) {
            console.error("Error auto-populating client data:", error);
            message.warning({
              content: "Some product details could not be auto-populated. Please fill them in manually.",
              duration: 4,
            });
          } finally {
            setIsLoading(false);
          }
        }
        // Auto-populate product details if sup_id and bom_pcf_id are provided (supplier mode)
        else if (sup_id && bom_pcf_id) {
          setIsLoading(true);
          try {
            // First check if questionnaire is already submitted
            const statusResult = await supplierQuestionnaireService.checkQuestionnaireStatus(
              bom_pcf_id,
              sup_id,
            );
            if (statusResult.success && statusResult.data?.is_submitted) {
              setIsCompleted(true);
              setIsLoading(false);
              return; // Don't load the form if already completed
            }

            const result =
              await supplierQuestionnaireService.getPCFBOMListToAutoPopulate(
                bom_pcf_id,
                sup_id,
              );
            if (result.success && result.data) {
              console.log("Auto-populate API response:", result.data);

              // Transform API response array to form data structure
              // API returns: [{ bom_id, bom_code, material_number, component_name, supplier_id }, ...]
              const bomList = Array.isArray(result.data) ? result.data : [];

              console.log("BOM list from API:", bomList);

              // Map to production_site_details table format
              // Schema expects: [{ bom_id, material_number, mpn, component_name, location }, ...]
              const productionSiteDetails = bomList.map(
                (item: any, index: number) => {
                  const mapped = {
                    ...(item.bom_id && { bom_id: item.bom_id }),
                    ...(item.material_number && {
                      material_number: item.material_number,
                    }),
                    mpn: item.material_number || "",
                    component_name: item.component_name || "",
                    location: item.production_location || item.location || "", // May not be in API response
                  };
                  console.log(`Mapped item ${index}:`, {
                    original: item,
                    mapped,
                  });
                  return mapped;
                },
              );

              console.log(
                "Final productionSiteDetails array:",
                productionSiteDetails,
              );

              // Map to products_manufactured table format
              // Expected: [{ bom_id, material_number, mpn, product_name, production_period, weight_per_unit, unit, price, quantity }, ...]
              const productsManufactured = bomList.map((item: any) => ({
                ...(item.bom_id && { bom_id: item.bom_id }),
                ...(item.material_number && {
                  material_number: item.material_number,
                }),
                mpn: item.material_number || "",
                product_name: item.component_name || "",
                production_period: "",
                weight_per_unit: 0,
                unit: "",
                price: 0,
                quantity: 0,
              }));

              const autoPopulatedData: any = {
                product_details: {
                  production_site_details: productionSiteDetails,
                  products_manufactured: productsManufactured,
                },
              };

              console.log(
                "Transformed auto-populated data:",
                autoPopulatedData,
              );
              console.log("Production site details:", productionSiteDetails);
              console.log("Products manufactured:", productsManufactured);

              // Merge with existing form data
              const mergedFormData = {
                ...formData,
                ...autoPopulatedData,
              };

              console.log("Merged form data:", mergedFormData);
              console.log(
                "Production site details in merged data:",
                mergedFormData.product_details?.production_site_details,
              );

              // Update formData state - this will trigger the useEffect that sets form values
              setFormData(mergedFormData);

              // Also directly set form values to ensure they're applied
              // Use setTimeout to ensure form is ready and current step is loaded
              setTimeout(() => {
                const currentValues = form.getFieldsValue();
                console.log(
                  "Current form values before update:",
                  currentValues,
                );

                // Set the values
                form.setFieldsValue(mergedFormData);

                // Force update by getting values again
                const updatedValues = form.getFieldsValue();
                console.log("Form values after update:", updatedValues);
                console.log(
                  "Production site details in form:",
                  updatedValues.product_details?.production_site_details,
                );
              }, 200);

              // Track auto-populated fields
              const autoPopulatedFieldNames = new Set<string>();
              if (productionSiteDetails.length > 0) {
                autoPopulatedFieldNames.add(
                  "product_details.production_site_details",
                );
              }
              if (productsManufactured.length > 0) {
                autoPopulatedFieldNames.add(
                  "product_details.products_manufactured",
                );
              }
              setAutoPopulatedFields(autoPopulatedFieldNames);

              if (bomList.length > 0) {
                message.success({
                  content: `Successfully auto-populated ${bomList.length} item(s) from BOM data.`,
                  duration: 3,
                });
              }
            } else {
              console.warn("Auto-populate failed:", result.message);
            }
          } catch (error) {
            console.error("Error auto-populating data:", error);
            message.warning({
              content:
                "Some product details could not be auto-populated. Please fill them in manually.",
              duration: 4,
            });
          } finally {
            setIsLoading(false);
          }
        }

        // Load draft if exists
        const draft = supplierQuestionnaireService.loadDraft(
          sup_id,
          bom_pcf_id,
        );
        if (draft) {
          // Use deep merge to preserve nested structure while draft values take precedence
          setFormData((prevData) => {
            const result = { ...prevData };
            const mergeDeep = (target: any, source: any): any => {
              const merged = { ...target };
              for (const key in source) {
                if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                  merged[key] = mergeDeep(merged[key] || {}, source[key]);
                } else {
                  merged[key] = source[key];
                }
              }
              return merged;
            };
            return mergeDeep(result, draft.formData);
          });
          // Validate step index against current schema
          const savedStep = draft.currentStep || 0;
          if (savedStep < QUESTIONNAIRE_SCHEMA.length) {
            setCurrentStep(savedStep);
          }
        }
      }
    };

    loadData();
  }, [
    sgiq_id,
    sup_id,
    bom_pcf_id,
    user_id,
    isViewMode,
    isEditMode,
    isCreateMode,
    form,
    isOnboarded,
    showOnboardingForm,
    isClientMode,
  ]);

  // Update form values when step changes or data loads
  useEffect(() => {
    form.setFieldsValue(formData);
  }, [currentStep, formData, form]);

  // Deep merge utility to preserve nested values (especially file fields)
  // preserveTargetArrays: when true, keeps target arrays if source arrays are empty (for auto-save)
  // when false, source always wins (for draft loading)
  const deepMerge = (target: any, source: any, preserveTargetArrays = false): any => {
    const result = { ...target };
    for (const key in source) {
      if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        // Recursively merge nested objects
        result[key] = deepMerge(result[key] || {}, source[key], preserveTargetArrays);
      } else if (Array.isArray(source[key])) {
        // For arrays with preserveTargetArrays, only use source if it has items OR target is empty
        // This prevents empty form arrays from overwriting saved file arrays in auto-save
        const targetArray = result[key];
        const sourceArray = source[key];
        if (!preserveTargetArrays || sourceArray.length > 0 || !targetArray || targetArray.length === 0) {
          result[key] = sourceArray;
        }
        // Otherwise keep target array (preserves file keys)
      } else {
        result[key] = source[key];
      }
    }
    return result;
  };

  // Auto-save functionality
  useEffect(() => {
    if (isCreateMode && !isViewMode) {
      // Clear existing timer
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }

      // Set new timer for auto-save
      autoSaveTimerRef.current = setTimeout(() => {
        // Use formData directly - it's already kept up-to-date via onValuesChange
        // Avoid form.getFieldsValue() as it may return stale/empty values for file fields
        if (Object.keys(formData).length > 0) {
          setAutoSaveStatus("saving");
          supplierQuestionnaireService.saveDraft(
            formData,
            currentStep,
            sup_id,
            bom_pcf_id,
          );
          setAutoSaveStatus("saved");
          setLastSaved(new Date());

          // Reset to idle after 2 seconds
          setTimeout(() => setAutoSaveStatus("idle"), 2000);
        }
      }, 2000); // Auto-save after 2 seconds of inactivity

      return () => {
        if (autoSaveTimerRef.current) {
          clearTimeout(autoSaveTimerRef.current);
        }
      };
    }
  }, [formData, currentStep, isCreateMode, isViewMode, form]);

  // Track completed steps
  useEffect(() => {
    const checkStepCompletion = async () => {
      try {
        const values = form.getFieldsValue();
        const section = QUESTIONNAIRE_SCHEMA[currentStep];
        if (section) {
          const requiredFields = section.fields.filter(
            (f) => f.required && !f.dependency,
          );
          const hasRequiredData = requiredFields.every((field) => {
            const fieldValue = form.getFieldValue(field.name.split("."));
            return (
              fieldValue !== undefined &&
              fieldValue !== null &&
              fieldValue !== ""
            );
          });

          if (hasRequiredData) {
            setCompletedSteps((prev) => new Set([...prev, currentStep]));
          }
        }
      } catch (error) {
        // Ignore validation errors for completion check
      }
    };

    checkStepCompletion();
  }, [currentStep, formData, form]);

  // Calculate progress based on questions answered
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [totalQuestionsCount, setTotalQuestionsCount] = useState(0);

  useEffect(() => {
    const calculateProgress = () => {
      let totalQuestions = 0;
      let answeredQuestions = 0;

      // Get all current form values
      const allFormValues = form.getFieldsValue();
      // Use deep merge to preserve nested values (especially file fields across steps)
      const mergedValues = deepMerge(formData, allFormValues, true);

      const getNestedValue = (obj: any, path: string): any => {
        return path.split(".").reduce((acc, part) => {
          if (acc === null || acc === undefined) return undefined;
          return acc[part];
        }, obj);
      };

      const isFieldVisible = (field: any): boolean => {
        // Check if field has dependency and if it's met
        if (field.dependency) {
          const dependencyValue = getNestedValue(
            mergedValues,
            field.dependency.field,
          );
          const expectedValue = field.dependency.value;

          // Check if dependency field has been answered
          const isAnswered =
            dependencyValue !== undefined &&
            dependencyValue !== null &&
            dependencyValue !== "";

          if (!isAnswered) return false;

          if (typeof expectedValue === "boolean") {
            // Convert dependencyValue to boolean for comparison (handles "Yes"/"No" strings)
            const depBool =
              typeof dependencyValue === "string"
                ? dependencyValue.toLowerCase() === "yes" ||
                  dependencyValue.toLowerCase() === "true"
                : Boolean(dependencyValue);
            if (depBool !== expectedValue) return false;
          } else if (Array.isArray(dependencyValue)) {
            if (!dependencyValue.includes(expectedValue)) return false;
          } else {
            // Case-insensitive comparison for string values
            const depStr = String(dependencyValue).toLowerCase();
            const expStr = String(expectedValue).toLowerCase();
            if (depStr !== expStr) return false;
          }
        }
        return true;
      };

      const isFieldAnswered = (field: any): boolean => {
        const fieldValue = getNestedValue(mergedValues, field.name);

        // Check if field has a value
        if (field.type === "table") {
          // For tables, check if there's at least one row
          return Array.isArray(fieldValue) && fieldValue.length > 0;
        } else if (field.type === "checkbox" && field.options) {
          // For multi-select checkboxes, check if at least one is selected
          return Array.isArray(fieldValue) && fieldValue.length > 0;
        } else if (field.type === "checkbox") {
          // For single checkbox, check if it's checked
          return fieldValue === true;
        } else {
          // For other fields, check if value exists and is not empty
          return (
            fieldValue !== undefined &&
            fieldValue !== null &&
            fieldValue !== "" &&
            !(Array.isArray(fieldValue) && fieldValue.length === 0)
          );
        }
      };

      // Iterate through all sections and fields
      QUESTIONNAIRE_SCHEMA.forEach((section) => {
        section.fields.forEach((field) => {
          // Skip info fields (they're not questions)
          if (field.type === "info") {
            return;
          }

          // Check if field is visible (dependencies met)
          if (isFieldVisible(field)) {
            totalQuestions++;

            // Check if field is answered
            if (isFieldAnswered(field)) {
              answeredQuestions++;
            }
          }
        });
      });

      const percentage =
        totalQuestions === 0
          ? 0
          : Math.round((answeredQuestions / totalQuestions) * 100);
      setProgressPercentage(percentage);
      setAnsweredCount(answeredQuestions);
      setTotalQuestionsCount(totalQuestions);
    };

    calculateProgress();
  }, [formData, form, currentStep]);

  // Also recalculate when form values change
  useEffect(() => {
    const timer = setTimeout(() => {
      const allFormValues = form.getFieldsValue();
      if (Object.keys(allFormValues).length > 0) {
        setFormData((prev) => ({ ...prev, ...allFormValues }));
      }
    }, 500); // Debounce form value updates

    return () => clearTimeout(timer);
  }, [form]);

  const completedCount = completedSteps.size;

  const handleNext = async () => {
    try {
      // Validate current step fields
      const values = await form.validateFields();

      // Merge current step values into global form data
      const updatedData = { ...formData, ...values };
      setFormData(updatedData);
      setFormErrors({});

      if (isCreateMode) {
        supplierQuestionnaireService.saveDraft(
          updatedData,
          currentStep + 1,
          sup_id,
          bom_pcf_id,
        );
        setLastSaved(new Date());
      }

      setCompletedSteps((prev) => new Set([...prev, currentStep]));
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error: any) {
      console.error("Validation failed:", error);

      // Extract and display field errors
      if (error.errorFields) {
        const errors: Record<string, string[]> = {};
        error.errorFields.forEach((field: any) => {
          const fieldName = field.name.join(".");
          if (!errors[fieldName]) {
            errors[fieldName] = [];
          }
          errors[fieldName].push(field.errors[0]);
        });
        setFormErrors(errors);
      }

      const errorCount = error.errorFields?.length || 0;
      if (errorCount > 0) {
        message.error({
          content: `Please complete ${errorCount} required ${errorCount === 1 ? "field" : "fields"} before continuing.`,
          duration: 4,
        });
      } else {
        message.error("Please fill in all required fields before continuing.");
      }
      // Scroll to first error
      const firstErrorField = document.querySelector(
        ".ant-form-item-has-error",
      );
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  };

  const handlePrev = () => {
    // Save current values before moving back
    const values = form.getFieldsValue();
    setFormData({ ...formData, ...values });
    setFormErrors({});
    setCurrentStep(currentStep - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleStepJump = (step: number) => {
    if (step < currentStep || completedSteps.has(step)) {
      const values = form.getFieldsValue();
      setFormData({ ...formData, ...values });
      setFormErrors({});
      setCurrentStep(step);
      window.scrollTo({ top: 0, behavior: "smooth" });
      setSidebarVisible(false); // Close mobile sidebar
    }
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    setAutoSaveStatus("saving");
    try {
      const values = form.getFieldsValue();
      const updatedData = { ...formData, ...values };
      setFormData(updatedData);

      supplierQuestionnaireService.saveDraft(
        updatedData,
        currentStep,
        sup_id,
        bom_pcf_id,
      );
      setLastSaved(new Date());
      setAutoSaveStatus("saved");
      message.success({
        content: "Draft saved successfully! Your progress has been saved.",
        duration: 2,
      });

      setTimeout(() => setAutoSaveStatus("idle"), 2000);
    } catch (error) {
      setAutoSaveStatus("idle");
      message.error({
        content:
          "Unable to save your draft. Please check your internet connection and try again. Your progress may be lost if you leave this page.",
        duration: 5,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    try {
      console.log("Submitting questionnaire with formData:", formData);
      const values = await form.validateFields();
      const finalData = { ...formData, ...values };

      setIsSaving(true);
      setFormErrors({});

      let result;
      if (questionnaireId) {
        result = await supplierQuestionnaireService.updateQuestionnaire(
          questionnaireId,
          finalData,
        );
      } else if (isClientMode && client_id && product_id && bom_pcf_id) {
        // Client mode - use client-specific endpoint
        console.log("Submitting client questionnaire with:", { client_id, product_id, bom_pcf_id });
        result = await supplierQuestionnaireService.createClientQuestionnaire(
          finalData,
          client_id,
          product_id,
          bom_pcf_id,
        );
      } else {
        // Supplier mode - use supplier endpoint
        result = await supplierQuestionnaireService.createQuestionnaire(
          finalData,
          sup_id || undefined,
          bom_pcf_id || undefined,
        );
      }

      if (result.success) {
        supplierQuestionnaireService.clearDraft(sup_id, bom_pcf_id);

        // For supplier mode (public route) or client mode, show thank you page instead of navigating
        if (isPublicRoute || isClientMode) {
          setIsCompleted(true);
        } else {
          message.success({
            content:
              "Questionnaire submitted successfully! Thank you for completing the form.",
            duration: 4,
          });

          // Navigate to DQR or list
          const newId =
            result.data?.general_info?.sgiq_id ||
            result.data?.sgiq_id ||
            questionnaireId;
          if (newId) {
            // Optional: Redirect to view or DQR
            navigate("/supplier-questionnaire");
          }
        }
      } else {
        message.error({
          content: result.message
            ? `Submission failed: ${result.message}. Please review your answers and try again.`
            : "Unable to submit the questionnaire. Please check your internet connection and try again. If the problem persists, contact support.",
          duration: 6,
        });
      }
    } catch (error: any) {
      console.error("Submit error:", error);

      // Extract and display field errors
      if (error.errorFields) {
        const errors: Record<string, string[]> = {};
        error.errorFields.forEach((field: any) => {
          const fieldName = field.name.join(".");
          if (!errors[fieldName]) {
            errors[fieldName] = [];
          }
          errors[fieldName].push(field.errors[0]);
        });
        setFormErrors(errors);
      }

      const errorCount = error.errorFields?.length || 0;
      if (errorCount > 0) {
        message.error({
          content: `Cannot submit: ${errorCount} required ${errorCount === 1 ? "field" : "fields"} ${errorCount === 1 ? "is" : "are"} incomplete. Please review and complete all required fields.`,
          duration: 5,
        });
      } else {
        message.error(
          "Please fix all validation errors before submitting the questionnaire.",
        );
      }
      // Scroll to first error
      const firstErrorField = document.querySelector(
        ".ant-form-item-has-error",
      );
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Handle supplier onboarding form submission
  const handleOnboardingSubmit = async (values: any) => {
    if (!sup_id) return;

    setIsSubmittingOnboarding(true);
    try {
      const payload = {
        ...values,
        sup_id,
        supplier_supplied_categories: values.supplier_supplied_categories
          ? values.supplier_supplied_categories.split(",").map((s: string) => s.trim()).filter(Boolean)
          : [],
      };

      const result = await userManagementService.onboardSupplierPublic(payload);

      if (result.success) {
        message.success("Onboarding completed successfully! Proceeding to questionnaire...");
        setIsOnboarded(true);
        setShowOnboardingForm(false);
      } else {
        message.error(result.message || "Failed to complete onboarding");
      }
    } catch (error) {
      console.error("Error submitting onboarding:", error);
      message.error("An error occurred while submitting onboarding");
    } finally {
      setIsSubmittingOnboarding(false);
    }
  };

  // Keyboard shortcuts - using refs to avoid dependency issues
  const handleNextRef = useRef(handleNext);
  const handleSubmitRef = useRef(handleSubmit);

  useEffect(() => {
    handleNextRef.current = handleNext;
    handleSubmitRef.current = handleSubmit;
  });

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter to submit
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        if (currentStep === QUESTIONNAIRE_SCHEMA.length - 1) {
          handleSubmitRef.current();
        } else {
          handleNextRef.current();
        }
      }
      // Escape to close sidebar on mobile
      if (e.key === "Escape" && sidebarVisible) {
        setSidebarVisible(false);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [currentStep, sidebarVisible]);

  if (isLoading || isCheckingOnboarding) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" tip={isCheckingOnboarding ? "Checking supplier status..." : "Loading questionnaire..."} />
      </div>
    );
  }

  // Supplier Onboarding Form - Show before questionnaire if not onboarded
  if (showOnboardingForm && sup_id && !isClientMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                <InfoCircleOutlined className="text-2xl text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Supplier Registration Required
                </h1>
                <p className="text-gray-500">
                  Please complete your company registration before proceeding to the questionnaire
                </p>
              </div>
            </div>
          </div>

          {/* Onboarding Form */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg">
            <Form
              form={onboardingForm}
              layout="vertical"
              onFinish={handleOnboardingSubmit}
              className="space-y-6"
            >
              {/* Company Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h3>
                <Row gutter={16}>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="supplier_company_name"
                      label="Company Name"
                      rules={[{ required: true, message: "Please enter company name" }]}
                    >
                      <Input placeholder="Enter company name" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="supplier_name"
                      label="Contact Name"
                      rules={[{ required: true, message: "Please enter contact name" }]}
                    >
                      <Input placeholder="Enter contact name" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="supplier_email"
                      label="Email"
                      rules={[
                        { required: true, message: "Please enter email" },
                        { type: "email", message: "Please enter a valid email" },
                      ]}
                    >
                      <Input placeholder="Enter email" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="supplier_phone_number"
                      label="Phone Number"
                      rules={[{ required: true, message: "Please enter phone number" }]}
                    >
                      <Input placeholder="Enter phone number" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item name="supplier_alternate_phone_number" label="Alternate Phone">
                      <Input placeholder="Enter alternate phone" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item name="supplier_company_website" label="Website">
                      <Input placeholder="Enter website URL" />
                    </Form.Item>
                  </Col>
                </Row>
              </div>

              <Divider />

              {/* Business Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Details</h3>
                <Row gutter={16}>
                  <Col xs={24} md={8}>
                    <Form.Item name="supplier_business_type" label="Business Type">
                      <Select placeholder="Select business type">
                        <Select.Option value="Manufacturer">Manufacturer</Select.Option>
                        <Select.Option value="Distributor">Distributor</Select.Option>
                        <Select.Option value="Wholesaler">Wholesaler</Select.Option>
                        <Select.Option value="Retailer">Retailer</Select.Option>
                        <Select.Option value="Other">Other</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item name="supplier_years_in_business" label="Years in Business">
                      <Input placeholder="Enter years" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item name="supplier_number_of_employees" label="Number of Employees">
                      <Input placeholder="Enter number" />
                    </Form.Item>
                  </Col>
                  <Col xs={24}>
                    <Form.Item
                      name="supplier_supplied_categories"
                      label="Supplied Categories"
                      extra="Enter comma-separated values"
                    >
                      <Input.TextArea rows={2} placeholder="e.g., Electronics, Mechanical Parts, Raw Materials" />
                    </Form.Item>
                  </Col>
                </Row>
              </div>

              <Divider />

              {/* Location */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Location</h3>
                <Row gutter={16}>
                  <Col xs={24}>
                    <Form.Item name="supplier_registered_address" label="Registered Address">
                      <Input.TextArea rows={2} placeholder="Enter registered address" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="supplier_city"
                      label="City"
                      rules={[{ required: true, message: "Please enter city" }]}
                    >
                      <Input placeholder="Enter city" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="supplier_state"
                      label="State"
                      rules={[{ required: true, message: "Please enter state" }]}
                    >
                      <Input placeholder="Enter state" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="supplier_country"
                      label="Country"
                      rules={[{ required: true, message: "Please enter country" }]}
                    >
                      <Input placeholder="Enter country" />
                    </Form.Item>
                  </Col>
                </Row>
              </div>

              <Divider />

              {/* Financial Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Details (Optional)</h3>
                <Row gutter={16}>
                  <Col xs={24} md={8}>
                    <Form.Item name="supplier_gst_number" label="GST Number">
                      <Input placeholder="Enter GST number" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item name="supplier_pan_number" label="PAN Number">
                      <Input placeholder="Enter PAN number" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item name="supplier_bank_name" label="Bank Name">
                      <Input placeholder="Enter bank name" />
                    </Form.Item>
                  </Col>
                </Row>
              </div>

              {/* Submit Button */}
              <div className="flex justify-center pt-6 border-t border-gray-100">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={isSubmittingOnboarding}
                  size="large"
                  icon={<CheckOutlined />}
                  className="!bg-purple-600 hover:!bg-purple-700 !border-purple-600 shadow-lg shadow-purple-600/20 px-12"
                >
                  Complete Registration & Continue
                </Button>
              </div>
            </Form>
          </div>

          {/* Footer */}
          <div className="text-center text-gray-500 text-sm">
            <p>Your registration information helps us better understand your business for PCF calculations.</p>
          </div>
        </div>
      </div>
    );
  }

  // Thank You UI for completed questionnaires
  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 max-w-lg w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircleOutlined className="text-4xl text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Thank You!
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Your questionnaire has been successfully submitted.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-center gap-2 text-green-700">
              <SmileOutlined className="text-xl" />
              <span className="font-medium">
                We appreciate your time and effort in completing this questionnaire.
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-500">
            Your responses have been recorded and will be used for the Product Carbon Footprint calculation.
            You may now close this window.
          </p>
        </div>
      </div>
    );
  }

  const currentSection = QUESTIONNAIRE_SCHEMA[currentStep];

  const renderSidebar = () => {
    const sidebarContent = (
      <div className="bg-white rounded-xl shadow-sm p-6">
        {/* Progress Section */}
        <div className="mb-6 pb-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm text-gray-500">
              {currentStep + 1} of {QUESTIONNAIRE_SCHEMA.length}
            </span>
          </div>
          <Progress
            percent={progressPercentage}
            showInfo={false}
            strokeColor={{
              "0%": "#52c41a",
              "100%": "#73d13d",
            }}
            className="mb-2"
          />
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              {answeredCount} of {totalQuestionsCount} questions answered
            </span>
            <span>{progressPercentage}%</span>
          </div>
        </div>

        {/* Steps */}
        <Steps
          direction="vertical"
          current={currentStep}
          onChange={handleStepJump}
        >
          {QUESTIONNAIRE_SCHEMA.map((section, index) => (
            <Step
              key={section.id}
              title={
                <div className="flex items-center justify-between w-full">
                  <span className="text-sm">{section.title}</span>
                  {completedSteps.has(index) && (
                    <CheckCircleOutlined className="text-green-500 ml-2" />
                  )}
                </div>
              }
              status={
                completedSteps.has(index)
                  ? "finish"
                  : index === currentStep
                    ? "process"
                    : index < currentStep
                      ? "finish"
                      : "wait"
              }
            />
          ))}
        </Steps>
      </div>
    );

    return sidebarContent;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {/* Mobile Menu Button - Always show */}
              <Button
                icon={<MenuOutlined />}
                type="text"
                onClick={() => setSidebarVisible(true)}
                className="lg:hidden mr-2"
              />
              {!isPublicRoute && (
                <Button
                  icon={<ArrowLeftOutlined />}
                  type="text"
                  onClick={() => navigate("/dashboard")}
                  className="mr-2 hidden lg:inline-flex"
                />
              )}
              <h1 className="text-xl font-bold text-gray-900">
                {isClientMode ? "Manufacturer Own Emissions Questionnaire" : "Supplier Questionnaire"}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              {/* Auto-save Status */}
              {isCreateMode && (
                <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
                  {autoSaveStatus === "saving" && (
                    <Tooltip title="Saving...">
                      <ClockCircleOutlined className="animate-spin" />
                    </Tooltip>
                  )}
                  {autoSaveStatus === "saved" && (
                    <Tooltip
                      title={`Saved at ${lastSaved?.toLocaleTimeString()}`}
                    >
                      <CheckCircleOutlined className="text-green-500" />
                    </Tooltip>
                  )}
                  {lastSaved && autoSaveStatus === "idle" && (
                    <Tooltip
                      title={`Last saved: ${lastSaved.toLocaleTimeString()}`}
                    >
                      <span className="text-xs">Auto-saved</span>
                    </Tooltip>
                  )}
                </div>
              )}
              {isCreateMode && (
                <Button
                  icon={<SaveOutlined />}
                  onClick={handleSaveDraft}
                  loading={isSaving}
                >
                  <span className="hidden sm:inline">Save Draft</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Desktop Sidebar - Always show */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-24">{renderSidebar()}</div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 transition-all duration-300">
              {/* Error Summary */}
              {Object.keys(formErrors).length > 0 && (
                <Alert
                  message={
                    <span className="font-semibold">
                      {Object.keys(formErrors).length}{" "}
                      {Object.keys(formErrors).length === 1
                        ? "Error"
                        : "Errors"}{" "}
                      Found
                    </span>
                  }
                  description={
                    <div className="mt-2">
                      <p className="text-sm mb-2 text-gray-700">
                        Please review and fix the following{" "}
                        {Object.keys(formErrors).length === 1
                          ? "error"
                          : "errors"}{" "}
                        before continuing:
                      </p>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        {Object.entries(formErrors).map(([field, errors]) => {
                          // Try to get the field label from the current section
                          const fieldConfig = currentSection?.fields.find(
                            (f) => f.name === field,
                          );
                          const fieldLabel =
                            fieldConfig?.label ||
                            field.split(".").pop() ||
                            field;
                          const questionNumber =
                            fieldLabel.match(/^\d+\./)?.[0] || "";

                          return (
                            <li key={field} className="text-sm text-gray-800">
                              <span className="font-medium">
                                {questionNumber ? `${questionNumber} ` : ""}
                                {fieldLabel.replace(/^\d+\.\s*/, "")}:
                              </span>{" "}
                              <span className="text-red-600">
                                {errors.join(", ")}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  }
                  type="error"
                  showIcon
                  closable
                  onClose={() => setFormErrors({})}
                  className="mb-6"
                  action={
                    <Button
                      size="small"
                      type="text"
                      onClick={() => {
                        const firstErrorField = document.querySelector(
                          ".ant-form-item-has-error",
                        );
                        if (firstErrorField) {
                          firstErrorField.scrollIntoView({
                            behavior: "smooth",
                            block: "center",
                          });
                        }
                      }}
                    >
                      Go to first error
                    </Button>
                  }
                />
              )}

              <DynamicQuestionnaireForm
                section={currentSection}
                initialValues={formData}
                form={form}
                onFinish={() => {}}
                onValuesChange={(changedValues, allValues) => {
                  // Update formData when values change to trigger progress recalculation
                  // Use deep merge to preserve nested structure (allValues has correct file values from DynamicQuestionnaireForm)
                  setFormData((prev) => deepMerge(prev, allValues));

                  // Call stage update API when supplier first inputs data (only for supplier mode)
                  if (sup_id && bom_pcf_id && !hasCalledStageUpdateRef.current && !isClientMode) {
                    hasCalledStageUpdateRef.current = true;
                    supplierQuestionnaireService.updateDataCollectionQuestionStage(bom_pcf_id, sup_id)
                      .then((result) => {
                        if (result.success) {
                          console.log("Data collection stage updated successfully");
                        } else {
                          console.warn("Failed to update data collection stage:", result.message);
                        }
                      })
                      .catch((error) => {
                        console.error("Error updating data collection stage:", error);
                      });
                  }
                }}
                autoPopulatedFields={autoPopulatedFields}
                formErrors={formErrors}
                isClientMode={isClientMode}
              />

              {/* Navigation Buttons */}
              <div className="flex flex-col sm:flex-row justify-between gap-4 mt-8 pt-6 border-t border-gray-100">
                <div className="flex gap-2">
                  <Button
                    onClick={handlePrev}
                    disabled={currentStep === 0}
                    icon={<ArrowLeftOutlined />}
                    size="large"
                  >
                    Previous
                  </Button>
                  {isCreateMode && !isPublicRoute && (
                    <Button
                      onClick={() => {
                        Modal.confirm({
                          title: "Save and Continue Later?",
                          content:
                            "Your progress will be saved and you can continue later.",
                          onOk: () => {
                            handleSaveDraft();
                            navigate("/dashboard");
                          },
                        });
                      }}
                      size="large"
                    >
                      Save & Exit
                    </Button>
                  )}
                </div>

                <div className="flex gap-2">
                  {currentStep < QUESTIONNAIRE_SCHEMA.length - 1 ? (
                    <>
                      <Button
                        onClick={handleNext}
                        type="primary"
                        icon={<ArrowRightOutlined />}
                        size="large"
                      >
                        Next
                      </Button>
                      <Tooltip title="Press Ctrl+Enter">
                        <span className="text-xs text-gray-400 self-center hidden sm:inline">
                          Ctrl+Enter
                        </span>
                      </Tooltip>
                    </>
                  ) : (
                    <>
                      <Button
                        type="primary"
                        onClick={handleSubmit}
                        loading={isSaving}
                        icon={<CheckOutlined />}
                        size="large"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Submit Questionnaire
                      </Button>
                      <Tooltip title="Press Ctrl+Enter">
                        <span className="text-xs text-gray-400 self-center hidden sm:inline">
                          Ctrl+Enter
                        </span>
                      </Tooltip>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Drawer - Always show */}
      <Drawer
        title="Navigation"
        placement="left"
        onClose={() => setSidebarVisible(false)}
        open={sidebarVisible}
        width={300}
        className="lg:hidden"
      >
        {renderSidebar()}
      </Drawer>
    </div>
  );
};

export default SupplierQuestionnaire;
