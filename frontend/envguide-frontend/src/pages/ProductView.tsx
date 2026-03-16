import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Spin,
  Tabs,
  Card,
  Tag,
  Button,
  Row,
  Col,
  Statistic,
  Divider,
  message,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Typography,
  Collapse,
  Table,
  Progress,
  Avatar,
  Pagination,
  Drawer,
  Menu,
} from "antd";
import type { TableColumnsType, MenuProps } from "antd";
// Note: Removed unused ant-design icons in favor of lucide-react
import {
  Package,
  FileText,
  ArrowLeft,
  Edit,
  Leaf,
  Puzzle,
  BarChart3,
  Clock,
  Home,
  Box,
  FileBarChart,
  Calculator,
  Send,
  Mail,
  User,
  Phone,
  MessageSquare,
  ChevronDown,
  Eye,
  Trash2,
  Plus,
  CircleDot,
  Layers,
  Activity,
  List,
  History,
  Database,
  Settings,
  Search,
  Info,
  X,
  Save,
  Download,
  Link2,
  Share2,
} from "lucide-react";
import productService from "../lib/productService";
import { usePermissions } from "../contexts/PermissionContext";
import type {
  Product,
  LinkedPCF,
  BomPcfDropdownItem,
  BomPcfDetails,
  BomListItem,
  SecondaryDataEntries,
  SecondaryDataBomItem,
  OwnEmissionItem,
} from "../lib/productService";
import ownEmissionService from "../lib/ownEmissionService";
import type {
  OwnEmission,
  OwnEmissionDocument,
  ContactTeamData,
} from "../lib/ownEmissionService";
import dayjs, { type Dayjs } from "dayjs";
import { useAuth } from "../contexts/AuthContext";

const { Title, Text } = Typography;
const { TextArea } = Input;

const ProductView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canUpdate, canDelete } = usePermissions();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [dataEntryMethod, setDataEntryMethod] = useState<
    "questionnaire" | "contact"
  >("questionnaire");

  // Own Emission Questionnaire state
  const [ownEmissionPcfId, setOwnEmissionPcfId] = useState<string | null>(null);
  const [questionnaireLink, setQuestionnaireLink] = useState<string>("");
  const [ownEmissionClientId, setOwnEmissionClientId] = useState<string>("");
  const [ownEmissionClientName, setOwnEmissionClientName] =
    useState<string>("");
  const [ownEmissionLinkLoading, setOwnEmissionLinkLoading] = useState(false);

  // Own Emission PCF selection state
  const [selectedOwnEmissionPcf, setSelectedOwnEmissionPcf] = useState<
    string | null
  >(null);
  const [selectedOwnEmissionItem, setSelectedOwnEmissionItem] =
    useState<OwnEmissionItem | null>(null);
  const [ownEmissionCalculating, setOwnEmissionCalculating] = useState(false);

  // Own Emissions state
  const [ownEmissionLoading, setOwnEmissionLoading] = useState(false);
  const [ownEmission, setOwnEmission] = useState<OwnEmission | null>(null);
  const [supportingDocs, setSupportingDocs] = useState<OwnEmissionDocument[]>(
    [],
  );
  const [reportingPeriodFrom, setReportingPeriodFrom] = useState<Dayjs | null>(
    null,
  );
  const [reportingPeriodTo, setReportingPeriodTo] = useState<Dayjs | null>(
    null,
  );
  const [fuelCombustionValue, setFuelCombustionValue] = useState<string>("");
  const [processEmissionValue, setProcessEmissionValue] = useState<string>("");
  const [fugitiveEmissionValue, setFugitiveEmissionValue] =
    useState<string>("");
  const [electricityLocationValue, setElectricityLocationValue] =
    useState<string>("");
  const [electricityMarketValue, setElectricityMarketValue] =
    useState<string>("");
  const [steamHeatCoolingValue, setSteamHeatCoolingValue] =
    useState<string>("");
  const [additionalNotes, setAdditionalNotes] = useState<string>("");

  // Contact form state
  const [contactFullName, setContactFullName] = useState<string>("");
  const [contactPhone, setContactPhone] = useState<string>("");
  const [contactEmail, setContactEmail] = useState<string>("");
  const [contactMessage, setContactMessage] = useState<string>("");

  // Contact form validation errors
  const [contactErrors, setContactErrors] = useState<{
    fullName?: string;
    phone?: string;
    email?: string;
  }>({});

  // Linked PCFs state
  const [linkedPCFs, setLinkedPCFs] = useState<LinkedPCF[]>([]);
  const [linkedPCFsLoading, setLinkedPCFsLoading] = useState(false);

  // BOM tab state
  const [bomPcfDropdown, setBomPcfDropdown] = useState<BomPcfDropdownItem[]>(
    [],
  );
  const [selectedBomPcfId, setSelectedBomPcfId] = useState<string | null>(null);
  const [bomPcfDetails, setBomPcfDetails] = useState<BomPcfDetails | null>(
    null,
  );
  const [bomLoading, setBomLoading] = useState(false);
  const [bomComponentSearch, setBomComponentSearch] = useState("");
  const [bomCurrentPage, setBomCurrentPage] = useState(1);
  const bomPageSize = 7;

  // PCF tab state
  const [pcfActiveMenu, setPcfActiveMenu] = useState<string>("pcf-overview");
  const [pcfHistoryData, setPcfHistoryData] = useState<BomPcfDetails[]>([]);
  const [pcfHistoryLoading, setPcfHistoryLoading] = useState(false);
  const [pcfHistoryTab, setPcfHistoryTab] = useState<string>("history");
  const [secondaryDataEntries, setSecondaryDataEntries] =
    useState<SecondaryDataEntries | null>(null);
  const [secondaryDataLoading, setSecondaryDataLoading] = useState(false);
  const [secondaryDataSelectedPcf, setSecondaryDataSelectedPcf] = useState<
    string | null
  >(null);
  const [secondaryDataSearch, setSecondaryDataSearch] = useState("");
  const [secondaryDataCurrentPage, setSecondaryDataCurrentPage] = useState(1);
  const [secondaryDataDrawerOpen, setSecondaryDataDrawerOpen] = useState(false);
  const [selectedSecondaryDataItem, setSelectedSecondaryDataItem] =
    useState<SecondaryDataBomItem | null>(null);
  const secondaryDataPageSize = 7;

  useEffect(() => {
    if (id) {
      fetchProduct(id);
      fetchOwnEmission(id);
    }
  }, [id]);

  const fetchProduct = async (productId: string) => {
    try {
      setLoading(true);
      const response = await productService.getProductById(productId);
      if (response.status && response.data) {
        setProduct(response.data);
        // Fetch linked PCFs, BOM dropdown, and PCF history using product code
        if (response.data.product_code) {
          fetchLinkedPCFs(response.data.product_code);
          fetchBomPcfDropdown(response.data.product_code);
          fetchPcfHistoryData(response.data.product_code);
        }
        // Auto-select first own_emission item if available
        if (
          response.data.own_emission &&
          response.data.own_emission.length > 0
        ) {
          const firstItem = response.data.own_emission[0];
          setSelectedOwnEmissionPcf(firstItem.bom_pcf_id);
          setSelectedOwnEmissionItem(firstItem);
        }
      } else {
        message.error("Failed to fetch product details");
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      message.error("Error fetching product details");
    } finally {
      setLoading(false);
    }
  };

  const fetchOwnEmission = async (productId: string) => {
    try {
      setOwnEmissionLoading(true);
      const response = await ownEmissionService.getByProductId(productId);
      if (response.status && response.data) {
        const data = response.data;
        setOwnEmission(data);
        setSupportingDocs(data.supporting_documents || []);

        // Populate form fields
        if (data.reporting_period_from) {
          setReportingPeriodFrom(dayjs(data.reporting_period_from));
        }
        if (data.reporting_period_to) {
          setReportingPeriodTo(dayjs(data.reporting_period_to));
        }
        setFuelCombustionValue(data.fuel_combustion_value || "");
        setProcessEmissionValue(data.process_emission_value || "");
        setFugitiveEmissionValue(data.fugitive_emission_value || "");
        setElectricityLocationValue(data.electicity_location_based_value || "");
        setElectricityMarketValue(data.electicity_market_based_value || "");
        setSteamHeatCoolingValue(data.steam_heat_cooling_value || "");
        setAdditionalNotes(data.additional_notes || "");
      }
    } catch (error) {
      console.error("Error fetching own emission:", error);
    } finally {
      setOwnEmissionLoading(false);
    }
  };

  const fetchLinkedPCFs = async (productCode: string) => {
    try {
      setLinkedPCFsLoading(true);
      const response =
        await productService.getLinkedPCFsByProductCode(productCode);
      if (response.status && response.data) {
        setLinkedPCFs(response.data);
      }
    } catch (error) {
      console.error("Error fetching linked PCFs:", error);
    } finally {
      setLinkedPCFsLoading(false);
    }
  };

  const fetchBomPcfDropdown = async (productCode: string) => {
    try {
      const response = await productService.getBomPcfDropdown(productCode);
      if (response.status && response.data) {
        setBomPcfDropdown(response.data);
        // Auto-select first item if available
        if (response.data.length > 0) {
          setSelectedBomPcfId(response.data[0].id);
          fetchBomPcfDetails(response.data[0].id);
          // Also auto-select for Own Emission dropdown if not already selected
          if (!selectedOwnEmissionPcf) {
            const firstItem = response.data[0];
            setSelectedOwnEmissionPcf(firstItem.id);
            setSelectedOwnEmissionItem({
              bom_pcf_id: firstItem.id,
              code: firstItem.code,
              request_title: firstItem.request_title,
              is_quetions_filled: false,
              is_own_emission_calculated: firstItem.is_own_emission_calculated,
            });
          }
        }
      }
    } catch (error) {
      console.error("Error fetching BOM PCF dropdown:", error);
    }
  };

  const fetchBomPcfDetails = async (bomPcfId: string) => {
    try {
      setBomLoading(true);
      const response = await productService.getBomPcfDetailsById(bomPcfId);
      if (response.status && response.data && response.data.length > 0) {
        setBomPcfDetails(response.data[0]);
      }
    } catch (error) {
      console.error("Error fetching BOM PCF details:", error);
    } finally {
      setBomLoading(false);
    }
  };

  const handleBomPcfChange = (value: string) => {
    setSelectedBomPcfId(value);
    setBomCurrentPage(1);
    fetchBomPcfDetails(value);
  };

  // Handle own emission PCF selection change
  const handleOwnEmissionPcfChange = (value: string) => {
    setSelectedOwnEmissionPcf(value);
    // First try to find in product's own_emission array
    let selectedItem = product?.own_emission?.find(
      (item) => item.bom_pcf_id === value,
    );
    // If not found, create a basic item from bomPcfDropdown
    if (!selectedItem) {
      const bomItem = bomPcfDropdown.find((item) => item.id === value);
      if (bomItem) {
        selectedItem = {
          bom_pcf_id: bomItem.id,
          code: bomItem.code,
          request_title: bomItem.request_title,
          is_quetions_filled: false,
          is_own_emission_calculated: bomItem.is_own_emission_calculated,
        };
      }
    }
    setSelectedOwnEmissionItem(selectedItem || null);
  };

  // Calculate PCF for own emission
  const handleCalculateOwnEmission = async () => {
    if (!selectedOwnEmissionPcf || !id) return;

    try {
      setOwnEmissionCalculating(true);
      const response = await productService.calculatePcfOwnEmission(
        selectedOwnEmissionPcf,
        id,
      );
      if (response.status) {
        message.success("PCF calculation completed successfully");
        // Refresh product data to get updated emission details
        await fetchProduct(id);
      } else {
        message.error(response.message || "Failed to calculate PCF");
      }
    } catch (error) {
      console.error("Error calculating PCF:", error);
      message.error("Error calculating PCF");
    } finally {
      setOwnEmissionCalculating(false);
    }
  };

  // Get questionnaire link for own emission
  const getOwnEmissionQuestionnaireLink = () => {
    if (!selectedOwnEmissionPcf || !id) return "";
    const baseUrl = window.location.origin;
    const clientId = user?.id || user?.userId || "";
    return `${baseUrl}/supplier-questionnaire?is_client=true&product_id=${id}&bom_pcf_id=${selectedOwnEmissionPcf}&client_id=${clientId}`;
  };

  // Check if DQR is submitted for an own emission item
  const isDqrSubmitted = (item: OwnEmissionItem | null): boolean => {
    if (!item?.pcf_dqr_data_collection_stage?.length) return false;
    return item.pcf_dqr_data_collection_stage.some(
      (stage) => stage.is_submitted === true,
    );
  };

  // Get own emission status for display
  const getOwnEmissionStatus = (
    item: OwnEmissionItem | null,
  ): { label: string; color: string; dotColor: string } => {
    if (!item)
      return { label: "Pending", color: "orange", dotColor: "bg-orange-500" };
    if (item.is_own_emission_calculated)
      return { label: "Calculated", color: "green", dotColor: "bg-green-500" };
    if (item.is_quetions_filled && isDqrSubmitted(item))
      return { label: "Ready", color: "blue", dotColor: "bg-blue-500" };
    if (item.is_quetions_filled && !isDqrSubmitted(item))
      return {
        label: "DQR Pending",
        color: "purple",
        dotColor: "bg-purple-500",
      };
    return { label: "Pending", color: "orange", dotColor: "bg-orange-500" };
  };

  const fetchPcfHistoryData = async (productCode: string) => {
    try {
      setPcfHistoryLoading(true);
      const response =
        await productService.getPcfBomHistoryDetails(productCode);
      if (response.status && response.data) {
        setPcfHistoryData(response.data);
      }
    } catch (error) {
      console.error("Error fetching PCF history:", error);
    } finally {
      setPcfHistoryLoading(false);
    }
  };

  const fetchSecondaryDataEntries = async (
    bomPcfId: string,
    productCode: string,
  ) => {
    try {
      setSecondaryDataLoading(true);
      const response = await productService.getSecondaryDataEntries(
        bomPcfId,
        productCode,
      );
      if (response.status && response.data) {
        setSecondaryDataEntries(response.data);
      }
    } catch (error) {
      console.error("Error fetching secondary data entries:", error);
    } finally {
      setSecondaryDataLoading(false);
    }
  };

  const handleSecondaryDataPcfChange = (value: string) => {
    setSecondaryDataSelectedPcf(value);
    setSecondaryDataCurrentPage(1);
    if (product?.product_code) {
      fetchSecondaryDataEntries(value, product.product_code);
    }
  };

  const handleViewSecondaryDataDetails = (item: SecondaryDataBomItem) => {
    setSelectedSecondaryDataItem(item);
    setSecondaryDataDrawerOpen(true);
  };

  const handleDeleteSupportingDocument = async (documentId: string) => {
    if (!documentId) return;
    try {
      // Original: Directly manipulated static UI without API call for deleting supporting documents
      setOwnEmissionLoading(true);
      const response =
        await ownEmissionService.deleteSupportingDocument(documentId);
      if (response.status) {
        message.success("Supporting document deleted successfully");
        if (id) {
          await fetchOwnEmission(id);
        }
      } else {
        message.error(
          response.message || "Failed to delete supporting document",
        );
      }
    } catch (error) {
      console.error("Error deleting supporting document:", error);
      message.error("Error deleting supporting document");
    } finally {
      setOwnEmissionLoading(false);
    }
  };

  const handleSaveOwnEmission = async () => {
    if (!product || !id) return;

    // Validate required fields
    if (!reportingPeriodFrom || !reportingPeriodTo) {
      message.error("Please select reporting period");
      return;
    }

    try {
      setOwnEmissionLoading(true);

      // Note: Using placeholder IDs since we don't have master data APIs
      const formData = {
        id: ownEmission?.id,
        product_id: id,
        reporting_period_from: reportingPeriodFrom.format("YYYY-MM-DD"),
        reporting_period_to: reportingPeriodTo.format("YYYY-MM-DD"),
        calculation_method_id: "DEFAULT_CALC_METHOD", // Placeholder

        fuel_combustion_id: "DEFAULT_FUEL_ID", // Placeholder
        fuel_combustion_value: fuelCombustionValue,
        process_emission_id: "DEFAULT_PROCESS_ID", // Placeholder
        process_emission_value: processEmissionValue,
        fugitive_emission_id: "DEFAULT_FUGITIVE_ID", // Placeholder
        fugitive_emission_value: fugitiveEmissionValue,

        electicity_location_based_id: "DEFAULT_ELEC_LOC_ID", // Placeholder
        electicity_location_based_value: electricityLocationValue,
        electicity_market_based_id: "DEFAULT_ELEC_MKT_ID", // Placeholder
        electicity_market_based_value: electricityMarketValue,
        steam_heat_cooling_id: "DEFAULT_STEAM_ID", // Placeholder
        steam_heat_cooling_value: steamHeatCoolingValue,

        additional_notes: additionalNotes,
      };

      let response;
      if (ownEmission?.id) {
        response = await ownEmissionService.update(formData);
      } else {
        response = await ownEmissionService.create(formData);
      }

      if (response.status) {
        message.success(
          ownEmission?.id ? "Updated successfully" : "Created successfully",
        );
        fetchOwnEmission(id); // Refresh data
      } else {
        message.error(response.message || "Failed to save");
      }
    } catch (error) {
      console.error("Error saving own emission:", error);
      message.error("Error saving own emission");
    } finally {
      setOwnEmissionLoading(false);
    }
  };

  const handleResetForm = () => {
    if (ownEmission) {
      // Reset to saved values
      setReportingPeriodFrom(
        ownEmission.reporting_period_from
          ? dayjs(ownEmission.reporting_period_from)
          : null,
      );
      setReportingPeriodTo(
        ownEmission.reporting_period_to
          ? dayjs(ownEmission.reporting_period_to)
          : null,
      );
      setFuelCombustionValue(ownEmission.fuel_combustion_value || "");
      setProcessEmissionValue(ownEmission.process_emission_value || "");
      setFugitiveEmissionValue(ownEmission.fugitive_emission_value || "");
      setElectricityLocationValue(
        ownEmission.electicity_location_based_value || "",
      );
      setElectricityMarketValue(
        ownEmission.electicity_market_based_value || "",
      );
      setSteamHeatCoolingValue(ownEmission.steam_heat_cooling_value || "");
      setAdditionalNotes(ownEmission.additional_notes || "");
    } else {
      // Clear all fields
      setReportingPeriodFrom(null);
      setReportingPeriodTo(null);
      setFuelCombustionValue("");
      setProcessEmissionValue("");
      setFugitiveEmissionValue("");
      setElectricityLocationValue("");
      setElectricityMarketValue("");
      setSteamHeatCoolingValue("");
      setAdditionalNotes("");
    }
  };

  const validateContactForm = (): boolean => {
    const errors: { fullName?: string; phone?: string; email?: string } = {};

    // Full Name validation
    if (!contactFullName.trim()) {
      errors.fullName = "Full name is required";
    } else if (contactFullName.trim().length < 2) {
      errors.fullName = "Full name must be at least 2 characters";
    }

    // Phone validation
    if (!contactPhone.trim()) {
      errors.phone = "Phone number is required";
    } else {
      const phoneRegex = /^[\d\s\-+()]{10,}$/;
      if (!phoneRegex.test(contactPhone.trim())) {
        errors.phone = "Please enter a valid phone number (min 10 digits)";
      }
    }

    // Email validation
    if (!contactEmail.trim()) {
      errors.email = "Email address is required";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contactEmail.trim())) {
        errors.email = "Please enter a valid email address";
      }
    }

    setContactErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitContactRequest = async () => {
    if (!validateContactForm()) {
      return;
    }

    try {
      setOwnEmissionLoading(true);
      const contactData: ContactTeamData = {
        full_name: contactFullName.trim(),
        phone_number: contactPhone.trim(),
        email_address: contactEmail.trim(),
        message: contactMessage.trim(),
        product_id: id,
      };

      const response =
        await ownEmissionService.submitContactRequest(contactData);
      if (response.status) {
        message.success("Request submitted successfully");
        // Clear form and errors
        setContactFullName("");
        setContactPhone("");
        setContactEmail("");
        setContactMessage("");
        setContactErrors({});
      } else {
        message.error(response.message || "Failed to submit request");
      }
    } catch (error) {
      console.error("Error submitting contact request:", error);
      message.error("Error submitting request");
    } finally {
      setOwnEmissionLoading(false);
    }
  };

  const calculateTotalEmissions = () => {
    // Check if we have selected PCF with emission data
    if (
      selectedOwnEmissionItem?.is_own_emission_calculated &&
      selectedOwnEmissionItem?.pcf_details?.own_emission_details?.length
    ) {
      const detail =
        selectedOwnEmissionItem.pcf_details.own_emission_details[0];
      const totalEmission = detail?.total_emission;

      if (totalEmission) {
        const total = totalEmission.total_pcf_value || 0;
        const material = totalEmission.material_value || 0;
        const waste = totalEmission.waste_value || 0;
        const logistic = totalEmission.logistic_value || 0;
        const packaging = totalEmission.packaging_value || 0;
        const production = totalEmission.production_value || 0;

        return {
          total: total.toFixed(6),
          material: material.toFixed(6),
          waste: waste.toFixed(6),
          logistic: logistic.toFixed(6),
          packaging: packaging.toFixed(6),
          production: production.toFixed(6),
          hasData: true,
          // Calculate percentages
          materialPercent:
            total > 0 ? ((material / total) * 100).toFixed(1) : "0",
          wastePercent: total > 0 ? ((waste / total) * 100).toFixed(1) : "0",
          logisticPercent:
            total > 0 ? ((logistic / total) * 100).toFixed(1) : "0",
          packagingPercent:
            total > 0 ? ((packaging / total) * 100).toFixed(1) : "0",
          productionPercent:
            total > 0 ? ((production / total) * 100).toFixed(1) : "0",
        };
      }
    }

    // Fallback to form values (legacy)
    const scope1 =
      (parseFloat(fuelCombustionValue) || 0) +
      (parseFloat(processEmissionValue) || 0) +
      (parseFloat(fugitiveEmissionValue) || 0);
    const scope2 =
      (parseFloat(electricityLocationValue) || 0) +
      (parseFloat(electricityMarketValue) || 0) +
      (parseFloat(steamHeatCoolingValue) || 0);
    const total = scope1 + scope2;

    return {
      total: total.toFixed(2),
      scope1: scope1.toFixed(2),
      scope2: scope2.toFixed(2),
      scope3: "0.00",
      hasData: false,
    };
  };

  const handleDelete = async () => {
    if (!product) return;
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await productService.deleteProduct(product.id);
        message.success("Product deleted successfully");
        navigate("/product-portfolio/all-products");
      } catch (error) {
        console.error("Error deleting product:", error);
        message.error("Failed to delete product");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <Spin size="large" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-6 text-center">
        <Text>Product not found</Text>
        <Button onClick={() => navigate("/product-portfolio/all-products")}>
          Back to List
        </Button>
      </div>
    );
  }

  // Calculate total components from linked PCFs
  const totalComponentsLinked = linkedPCFs.reduce((total, pcf) => {
    return total + (parseInt(pcf.total_component_used_count) || 0);
  }, 0);

  // Calculate total emission from linked PCFs
  const totalEmissionFromPCFs = linkedPCFs.reduce((total, pcf) => {
    return total + (pcf.overall_pcf || 0);
  }, 0);

  const items = [
    {
      key: "1",
      label: (
        <span className="flex items-center gap-2 px-1">
          <Home className="w-4 h-4" />
          Overview
        </span>
      ),
      children: (
        <div className="p-6 space-y-6">
          {/* Product Details Card */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Package className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg">
                      Product Details
                    </h3>
                    <p className="text-white/70 text-sm">
                      General information and specifications
                    </p>
                  </div>
                </div>
                <Tag className="bg-white/20 text-white border-0 rounded-full px-3 py-0.5 backdrop-blur-sm">
                  {product.category_name || "General"}
                </Tag>
              </div>
            </div>
            <div className="p-6">
              <Row gutter={[24, 24]}>
                <Col xs={24} sm={12} md={6}>
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 h-full min-h-[88px] flex flex-col justify-between">
                    <Text
                      type="secondary"
                      className="block text-xs mb-2 uppercase tracking-wider"
                    >
                      Category
                    </Text>
                    <Text strong className="text-base text-emerald-700">
                      {product.category_name || "-"}
                    </Text>
                  </div>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 h-full min-h-[88px] flex flex-col justify-between">
                    <Text
                      type="secondary"
                      className="block text-xs mb-2 uppercase tracking-wider"
                    >
                      Sub-Category
                    </Text>
                    <Text strong className="text-base text-blue-700">
                      {product.sub_category_name || "-"}
                    </Text>
                  </div>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 h-full min-h-[88px]">
                    <Text
                      type="secondary"
                      className="block text-xs mb-2 uppercase tracking-wider"
                    >
                      Created By
                    </Text>
                    <Text strong className="text-base text-purple-700">
                      {product.created_by_name || "System"}
                    </Text>
                    <Text className="block text-xs text-purple-500 mt-1">
                      {product.created_date
                        ? dayjs(product.created_date).format("DD MMM YYYY")
                        : "-"}
                    </Text>
                  </div>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 h-full min-h-[88px]">
                    <Text
                      type="secondary"
                      className="block text-xs mb-2 uppercase tracking-wider"
                    >
                      Last Updated
                    </Text>
                    <Text strong className="text-base text-amber-700">
                      {product.updated_by_name || "-"}
                    </Text>
                    <Text className="block text-xs text-amber-500 mt-1">
                      {product.update_date
                        ? dayjs(product.update_date).format("DD MMM YYYY")
                        : "-"}
                    </Text>
                  </div>
                </Col>
              </Row>
              {product.description && (
                <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <Text
                    type="secondary"
                    className="block text-xs mb-2 uppercase tracking-wider"
                  >
                    Description
                  </Text>
                  <Text className="text-gray-700 leading-relaxed">
                    {product.description}
                  </Text>
                </div>
              )}
            </div>
          </div>

          {/* Linked PCFs & Emission Metrics */}
          <Row gutter={24}>
            {/* Linked PCFs */}
            <Col xs={24} lg={12}>
              <div className="bg-white rounded-2xl border border-gray-200 h-full overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                        <Link2 className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <Text strong className="text-base text-gray-900 block">
                          Linked PCF Requests
                        </Text>
                        <Text type="secondary" className="text-xs">
                          {linkedPCFs.length} requests associated
                        </Text>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4 max-h-[320px] overflow-y-auto custom-scrollbar">
                  {linkedPCFsLoading ? (
                    <div className="flex justify-center py-12">
                      <Spin size="default" />
                    </div>
                  ) : linkedPCFs.length > 0 ? (
                    <div className="space-y-3">
                      {linkedPCFs.map((pcf) => (
                        <div
                          key={pcf.id}
                          className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                              {(pcf.request_title || pcf.code)
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                            <div>
                              <Text
                                strong
                                className="block text-sm group-hover:text-emerald-600 transition-colors"
                              >
                                {pcf.request_title || pcf.code}
                              </Text>
                              <Text type="secondary" className="text-xs">
                                PCF:{" "}
                                {pcf.overall_pcf
                                  ? `${pcf.overall_pcf} kg CO₂e`
                                  : "Pending"}
                              </Text>
                            </div>
                          </div>
                          <Tag
                            color={
                              pcf.status === "Approved"
                                ? "green"
                                : pcf.status === "Pending"
                                  ? "orange"
                                  : pcf.status === "In Progress"
                                    ? "blue"
                                    : "default"
                            }
                            className="rounded-full px-3 py-0.5 text-xs font-medium m-0"
                          >
                            {pcf.status}
                          </Tag>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
                        <Link2 className="w-8 h-8 text-emerald-300" />
                      </div>
                      <Text className="block text-gray-500 font-medium">
                        No PCF requests linked yet
                      </Text>
                      <Text type="secondary" className="text-xs mt-1">
                        Create a PCF request to get started
                      </Text>
                    </div>
                  )}
                </div>
              </div>
            </Col>

            {/* Emission Metrics */}
            <Col xs={24} lg={12}>
              <div className="bg-white rounded-2xl border border-gray-200 h-full overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                      <BarChart3 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <Text strong className="text-base text-gray-900 block">
                        Emission Metrics
                      </Text>
                      <Text type="secondary" className="text-xs">
                        Product carbon footprint summary
                      </Text>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  {/* Total Emission */}
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 p-6 text-white">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between">
                        <div>
                          <Text className="!text-white/90 text-sm font-medium block mb-2">
                            Total Emission
                          </Text>
                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold">
                              {totalEmissionFromPCFs > 0
                                ? totalEmissionFromPCFs
                                : product.ed_estimated_pcf
                                  ? product.ed_estimated_pcf
                                  : "0.00"}
                            </span>
                            <span className="text-white/80 text-sm font-medium">
                              kg CO₂e
                            </span>
                          </div>
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          <Leaf className="w-7 h-7 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Components Card */}
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800 p-6 text-white">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between">
                        <div>
                          <Text className="!text-white/90 text-sm font-medium block mb-2">
                            Total Components
                          </Text>
                          <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold">
                              {totalComponentsLinked}
                            </span>
                            <span className="text-white/80 text-sm font-medium">
                              active
                            </span>
                          </div>
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                          <Puzzle className="w-7 h-7 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </div>
      ),
    },
    {
      key: "2",
      label: (
        <span className="flex items-center gap-2 px-1">
          <Box className="w-4 h-4" />
          BOM
        </span>
      ),
      children: (
        <div className="p-6 space-y-6">
          {/* Quick Info Bar */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-white rounded-xl border border-gray-100">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <Text type="secondary" className="text-sm">
                  Category:
                </Text>
                <Text strong>{product.category_name || "-"}</Text>
              </div>
              <div className="h-4 w-px bg-gray-200"></div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <Text type="secondary" className="text-sm">
                  Type:
                </Text>
                <Text strong>{product.sub_category_name || "-"}</Text>
              </div>
              <div className="h-4 w-px bg-gray-200"></div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                <Text type="secondary" className="text-sm">
                  Created:
                </Text>
                <Text strong>
                  {product.created_date
                    ? dayjs(product.created_date).format("DD MMM YYYY")
                    : "-"}
                </Text>
              </div>
            </div>
            <Tag color="green" className="rounded-full px-3 py-0.5 font-medium">
              Active
            </Tag>
          </div>

          {/* PCF Selection & Analyzer */}
          <Row gutter={24}>
            {/* PCF Selection Card */}
            <Col xs={24} lg={8}>
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden h-full">
                <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                      <FileBarChart className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <Text strong className="text-base text-gray-900 block">
                        Select PCF
                      </Text>
                      <Text type="secondary" className="text-xs">
                        Choose a PCF request
                      </Text>
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <Select
                    value={selectedBomPcfId}
                    onChange={handleBomPcfChange}
                    className="w-full"
                    size="large"
                    loading={bomLoading}
                    suffixIcon={<ChevronDown size={16} />}
                    placeholder="Select PCF Request"
                  >
                    {bomPcfDropdown.map((item) => (
                      <Select.Option key={item.id} value={item.id}>
                        <div className="flex items-center gap-2">
                          <Avatar
                            size="small"
                            className="bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-xs"
                          >
                            {item.request_title?.charAt(0)?.toUpperCase() ||
                              "N"}
                          </Avatar>
                          <span>{item.request_title || item.code}</span>
                        </div>
                      </Select.Option>
                    ))}
                  </Select>
                  {bomPcfDetails && (
                    <div className="mt-4 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                      <Text className="text-emerald-700 text-xs flex items-center gap-2 font-medium">
                        <Clock className="w-4 h-4" />
                        Processed on{" "}
                        {bomPcfDetails.created_date
                          ? dayjs(bomPcfDetails.created_date).format(
                              "DD MMM YYYY",
                            )
                          : "-"}
                      </Text>
                    </div>
                  )}
                </div>
              </div>
            </Col>

            {/* PCF Analyser Card */}
            <Col xs={24} lg={16}>
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden h-full">
                <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                        <BarChart3 className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <Text strong className="text-base text-gray-900 block">
                          PCF Analyzer
                        </Text>
                        <Text type="secondary" className="text-xs">
                          Component PCF Progress
                        </Text>
                      </div>
                    </div>
                    <div className="text-right bg-white px-4 py-2 rounded-xl border border-emerald-100 shadow-sm">
                      <Text type="secondary" className="block text-xs">
                        Total PCF Value
                      </Text>
                      <Text strong className="text-xl text-emerald-600">
                        {bomPcfDetails?.overall_pcf
                          ? bomPcfDetails.overall_pcf.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })
                          : "0.00"}
                        <span className="text-xs ml-1 text-emerald-500 font-normal">
                          kg CO₂e
                        </span>
                      </Text>
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex justify-between items-center mb-3">
                    <Text className="text-sm font-medium">
                      Components Progress
                    </Text>
                    <Tag color="green" className="rounded-full px-3">
                      {bomPcfDetails?.bom_list?.length || 0}/
                      {bomPcfDetails?.bom_list?.length || 0} completed
                    </Tag>
                  </div>
                  <div className="relative">
                    <Progress
                      percent={100}
                      showInfo={false}
                      strokeColor={{
                        "0%": "#10b981",
                        "50%": "#059669",
                        "100%": "#047857",
                      }}
                      trailColor="#e5e7eb"
                      size={["100%", 16]}
                      className="rounded-full"
                    />
                  </div>
                  <div className="flex justify-between mt-2">
                    <Text type="secondary" className="text-xs">
                      0%
                    </Text>
                    <Text type="secondary" className="text-xs">
                      100%
                    </Text>
                  </div>
                </div>
              </div>
            </Col>
          </Row>

          {/* Components Table Section */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center shadow-lg shadow-slate-500/20">
                    <svg
                      className="w-4 h-4 text-white"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M20.5 11H19V7c0-1.1-.9-2-2-2h-4V3.5C13 2.12 11.88 1 10.5 1S8 2.12 8 3.5V5H4c-1.1 0-2 .9-2 2v3.8h1.5c1.5 0 2.7 1.2 2.7 2.7s-1.2 2.7-2.7 2.7H2V20c0 1.1.9 2 2 2h3.8v-1.5c0-1.5 1.2-2.7 2.7-2.7s2.7 1.2 2.7 2.7V22H17c1.1 0 2-.9 2-2v-4h1.5c1.38 0 2.5-1.12 2.5-2.5S21.88 11 20.5 11z"></path>
                    </svg>
                  </div>
                  <div>
                    <Text strong className="text-base block">
                      Bill of Materials
                    </Text>
                    <Text type="secondary" className="text-xs">
                      {(bomPcfDetails?.bom_list || []).length} components in
                      this product
                    </Text>
                  </div>
                </div>
                <Input
                  placeholder="Search components..."
                  prefix={<Search size={16} className="text-gray-400" />}
                  value={bomComponentSearch}
                  onChange={(e) => {
                    setBomComponentSearch(e.target.value);
                    setBomCurrentPage(1);
                  }}
                  className="rounded-lg !w-fit"
                  size="large"
                  allowClear
                />
              </div>
            </div>

            {/* Components Table */}
            {bomLoading ? (
              <div className="flex justify-center py-16">
                <Spin size="large" />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
                        <th className="px-5 py-4 text-left text-sm font-semibold">
                          Material Number
                        </th>
                        <th className="px-5 py-4 text-left text-sm font-semibold">
                          Component
                        </th>
                        <th className="px-5 py-4 text-center text-sm font-semibold">
                          Components
                        </th>
                        <th className="px-5 py-4 text-center text-sm font-semibold">
                          Sub Components
                        </th>
                        <th className="px-5 py-4 text-center text-sm font-semibold">
                          Quantity
                        </th>
                        <th className="px-5 py-4 text-right text-sm font-semibold">
                          Total PCF
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const filteredBomList = (
                          bomPcfDetails?.bom_list || []
                        ).filter(
                          (item) =>
                            item.component_name
                              ?.toLowerCase()
                              .includes(bomComponentSearch.toLowerCase()) ||
                            item.material_number
                              ?.toLowerCase()
                              .includes(bomComponentSearch.toLowerCase()),
                        );
                        const paginatedList = filteredBomList.slice(
                          (bomCurrentPage - 1) * bomPageSize,
                          bomCurrentPage * bomPageSize,
                        );

                        if (paginatedList.length === 0) {
                          return (
                            <tr>
                              <td
                                colSpan={6}
                                className="px-4 py-8 text-center text-gray-500"
                              >
                                No components found
                              </td>
                            </tr>
                          );
                        }

                        return paginatedList.map((item, index) => (
                          <tr
                            key={item.id}
                            className={`border-b border-gray-100 hover:bg-emerald-50/50 transition-colors ${
                              index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                            }`}
                          >
                            <td className="px-5 py-4">
                              <Tag className="bg-slate-100 border-0 text-slate-600 font-mono text-xs">
                                {item.material_number || "-"}
                              </Tag>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                                  <span className="text-emerald-600 text-xs font-semibold">
                                    {(item.component_name || "-")
                                      .charAt(0)
                                      .toUpperCase()}
                                  </span>
                                </div>
                                <Text className="font-medium text-gray-800">
                                  {item.component_name || "-"}
                                </Text>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-center">
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-semibold text-sm">
                                {item.material_emission?.length || 1}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-center">
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-50 text-purple-600 font-semibold text-sm">
                                {item.material_emission?.length
                                  ? Math.max(
                                      0,
                                      item.material_emission.length - 1,
                                    )
                                  : 0}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-center">
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-50 text-amber-600 font-semibold text-sm">
                                {item.quantity || 1}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-semibold text-sm">
                                {item.pcf_total_emission_calculation
                                  ?.total_pcf_value
                                  ? `${item.pcf_total_emission_calculation.total_pcf_value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`
                                  : "-"}
                                <span className="text-emerald-500 text-xs font-normal">
                                  kg CO₂e
                                </span>
                              </span>
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex justify-between items-center px-6 py-4 bg-gray-50/50 border-t border-gray-100">
                  <Text type="secondary" className="text-sm">
                    Showing{" "}
                    <span className="font-semibold text-gray-700">
                      {Math.min(
                        (bomCurrentPage - 1) * bomPageSize + 1,
                        (bomPcfDetails?.bom_list || []).filter(
                          (item) =>
                            item.component_name
                              ?.toLowerCase()
                              .includes(bomComponentSearch.toLowerCase()) ||
                            item.material_number
                              ?.toLowerCase()
                              .includes(bomComponentSearch.toLowerCase()),
                        ).length,
                      )}
                    </span>{" "}
                    to{" "}
                    <span className="font-semibold text-gray-700">
                      {Math.min(
                        bomCurrentPage * bomPageSize,
                        (bomPcfDetails?.bom_list || []).filter(
                          (item) =>
                            item.component_name
                              ?.toLowerCase()
                              .includes(bomComponentSearch.toLowerCase()) ||
                            item.material_number
                              ?.toLowerCase()
                              .includes(bomComponentSearch.toLowerCase()),
                        ).length,
                      )}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-gray-700">
                      {
                        (bomPcfDetails?.bom_list || []).filter(
                          (item) =>
                            item.component_name
                              ?.toLowerCase()
                              .includes(bomComponentSearch.toLowerCase()) ||
                            item.material_number
                              ?.toLowerCase()
                              .includes(bomComponentSearch.toLowerCase()),
                        ).length
                      }
                    </span>{" "}
                    entries
                  </Text>
                  <Pagination
                    current={bomCurrentPage}
                    pageSize={bomPageSize}
                    total={
                      (bomPcfDetails?.bom_list || []).filter(
                        (item) =>
                          item.component_name
                            ?.toLowerCase()
                            .includes(bomComponentSearch.toLowerCase()) ||
                          item.material_number
                            ?.toLowerCase()
                            .includes(bomComponentSearch.toLowerCase()),
                      ).length
                    }
                    onChange={(page) => setBomCurrentPage(page)}
                    showSizeChanger={false}
                    size="default"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "3",
      label: (
        <span className="flex items-center gap-2 px-1">
          <Leaf className="w-4 h-4" />
          Own Emission
        </span>
      ),
      children: (
        <Row gutter={24} className="p-6">
          {/* Main Content */}
          <Col xs={24} lg={16}>
            {/* PCF Selection Card */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                      <svg
                        className="w-5 h-5 text-white"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                      </svg>
                    </div>
                    <div>
                      <Text strong className="text-lg block">
                        Select PCF Request
                      </Text>
                      <Text type="secondary" className="text-sm">
                        Choose a PCF to view or calculate emissions
                      </Text>
                    </div>
                  </div>
                  {selectedOwnEmissionItem && (
                    <Tag
                      color={
                        getOwnEmissionStatus(selectedOwnEmissionItem).color
                      }
                      className="rounded-full px-4 py-1"
                    >
                      {getOwnEmissionStatus(selectedOwnEmissionItem).label}
                    </Tag>
                  )}
                </div>
              </div>
              <div className="p-6">
                <Select
                  placeholder="Select a PCF request"
                  size="large"
                  className="w-full"
                  value={selectedOwnEmissionPcf}
                  onChange={handleOwnEmissionPcfChange}
                  loading={loading || bomLoading}
                  allowClear
                  showSearch
                  filterOption={(input, option) =>
                    (option?.children as unknown as string)
                      ?.toLowerCase()
                      .includes(input.toLowerCase())
                  }
                >
                  {bomPcfDropdown.map((item) => (
                    <Select.Option key={item.id} value={item.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${item.is_own_emission_calculated ? "bg-emerald-500" : "bg-amber-500"}`}
                        ></div>
                        {item.code} - {item.request_title || "PCF Request"}
                      </div>
                    </Select.Option>
                  ))}
                </Select>
              </div>

              {/* Status and Actions based on selected PCF */}
              {selectedOwnEmissionItem && (
                <div className="p-6 border-t border-gray-100">
                  {/* Questionnaire not filled - Two options side by side */}
                  {!selectedOwnEmissionItem.is_quetions_filled && (
                    <Row gutter={20}>
                      {/* Option 1: Fill Questionnaire */}
                      <Col span={12}>
                        <div className="group relative overflow-hidden bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-2xl p-6 h-full hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-100 transition-all cursor-pointer">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-200/30 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                          <div className="relative z-10">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/25 group-hover:scale-110 transition-transform">
                              <FileText className="text-white w-6 h-6" />
                            </div>
                            <Text
                              strong
                              className="block mb-2 text-lg text-gray-800"
                            >
                              Fill Questionnaire
                            </Text>
                            <Text className="text-sm text-gray-600 block mb-5">
                              Complete the emission questionnaire yourself to
                              calculate product emissions.
                            </Text>
                            <div className="flex gap-3">
                              <Button
                                type="primary"
                                icon={<Link2 size={16} />}
                                size="large"
                                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 border-0 rounded-xl shadow-lg shadow-emerald-500/25"
                                onClick={() => {
                                  const link =
                                    getOwnEmissionQuestionnaireLink();
                                  if (link) {
                                    window.open(link, "_blank");
                                  }
                                }}
                              >
                                Open Form
                              </Button>
                              <Button
                                icon={<Link2 size={16} />}
                                size="large"
                                className="rounded-xl border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                                onClick={() => {
                                  const link =
                                    getOwnEmissionQuestionnaireLink();
                                  if (link) {
                                    navigator.clipboard.writeText(link);
                                    message.success(
                                      "Link copied to clipboard!",
                                    );
                                  }
                                }}
                              >
                                Copy Link
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Col>
                      {/* Option 2: Contact Enviguide */}
                      <Col span={12}>
                        <div className="group relative overflow-hidden bg-gradient-to-br from-slate-50 to-gray-100 border-2 border-slate-200 rounded-2xl p-6 h-full hover:border-slate-300 hover:shadow-lg hover:shadow-slate-100 transition-all cursor-pointer">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-slate-200/30 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                          <div className="relative z-10">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center mb-4 shadow-lg shadow-slate-500/25 group-hover:scale-110 transition-transform">
                              <Mail className="text-white w-6 h-6" />
                            </div>
                            <Text
                              strong
                              className="block mb-2 text-lg text-gray-800"
                            >
                              Contact Enviguide Team
                            </Text>
                            <Text className="text-sm text-gray-600 block mb-5">
                              Get expert assistance with your emission
                              calculations from our team.
                            </Text>
                            <Button
                              type="primary"
                              icon={<Send size={16} />}
                              size="large"
                              className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 border-0 rounded-xl shadow-lg shadow-slate-500/25"
                              onClick={() => {
                                setDataEntryMethod("contact");
                                message.info(
                                  "Please fill out the contact form below",
                                );
                              }}
                            >
                              Contact Team
                            </Button>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  )}

                  {/* Questionnaire filled but DQR not submitted */}
                  {selectedOwnEmissionItem.is_quetions_filled &&
                    !isDqrSubmitted(selectedOwnEmissionItem) &&
                    !selectedOwnEmissionItem.is_own_emission_calculated && (
                      <div className="relative overflow-hidden bg-gradient-to-r from-purple-500 via-purple-600 to-violet-600 rounded-2xl p-6 text-white">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
                        <div className="relative z-10 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                              <Clock className="w-7 h-7 text-white" />
                            </div>
                            <div>
                              <Text className="block text-lg font-semibold text-white">
                                DQR Submission Pending
                              </Text>
                              <Text className="text-purple-100 text-sm">
                                Questionnaire completed. Please submit the Data
                                Quality Rating to proceed with calculation.
                              </Text>
                            </div>
                          </div>
                          <Tag
                            color="white"
                            className="text-purple-600 font-semibold rounded-xl px-4 py-1"
                          >
                            Awaiting DQR
                          </Tag>
                        </div>
                      </div>
                    )}

                  {/* Questionnaire filled and DQR submitted but not calculated */}
                  {selectedOwnEmissionItem.is_quetions_filled &&
                    isDqrSubmitted(selectedOwnEmissionItem) &&
                    !selectedOwnEmissionItem.is_own_emission_calculated && (
                      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 rounded-2xl p-6 text-white">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
                        <div className="relative z-10 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                              <CircleDot className="w-7 h-7 text-white" />
                            </div>
                            <div>
                              <Text className="block text-lg font-semibold text-white">
                                Ready for Calculation
                              </Text>
                              <Text className="text-emerald-100 text-sm">
                                Questionnaire and DQR submitted. Calculate
                                emissions now.
                              </Text>
                            </div>
                          </div>
                          <Button
                            type="primary"
                            icon={<Calculator size={16} />}
                            size="large"
                            className="bg-white text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 border-0 rounded-xl shadow-lg font-semibold"
                            onClick={handleCalculateOwnEmission}
                            loading={ownEmissionCalculating}
                          >
                            Calculate Emissions
                          </Button>
                        </div>
                      </div>
                    )}

                  {/* Calculation complete - show emission details */}
                  {selectedOwnEmissionItem.is_quetions_filled &&
                    selectedOwnEmissionItem.is_own_emission_calculated &&
                    selectedOwnEmissionItem.pcf_details
                      ?.own_emission_details && (
                      <div className="space-y-6">
                        {(() => {
                          // own_emission_details is directly an array
                          const detailItems =
                            selectedOwnEmissionItem.pcf_details
                              ?.own_emission_details || [];

                          if (detailItems.length === 0) {
                            return (
                              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-8 text-center">
                                <div className="w-16 h-16 mx-auto bg-emerald-100 rounded-2xl flex items-center justify-center mb-4">
                                  <BarChart3 className="text-emerald-300 w-8 h-8" />
                                </div>
                                <Text className="text-gray-500 font-medium text-lg">
                                  No emission details available
                                </Text>
                              </div>
                            );
                          }

                          const detail = detailItems[0]; // Use first item
                          const totalEmission = detail.total_emission;
                          const materialEmissions =
                            detail.material_emission || [];
                          const logisticEmission = detail.logistic_emission;
                          const packagingEmission = detail.packaging_emission;
                          const productionEmission = detail.production_emission;
                          const wasteEmission = detail.waste_emission;
                          const allocation = detail.allocation_methodology;

                          return (
                            <>
                              {/* Total Emission Summary - Hero Card */}
                              <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 rounded-2xl p-6">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
                                <div className="relative z-10">
                                  <div className="flex items-center gap-3 mb-6">
                                    <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                      <BarChart3 className="text-white w-6 h-6" />
                                    </div>
                                    <div>
                                      <span className="text-white/90 text-sm block">
                                        Total PCF Summary
                                      </span>
                                      <span className="text-white text-xl font-bold block">
                                        Emission Breakdown
                                      </span>
                                    </div>
                                  </div>
                                  <Row gutter={[16, 16]}>
                                    <Col span={8}>
                                      <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 border border-white/25">
                                        <span className="text-white text-xs font-medium block mb-1">
                                          Total PCF Value
                                        </span>
                                        <span className="text-white text-2xl font-bold block">
                                          {(
                                            totalEmission?.total_pcf_value || 0
                                          ).toFixed(4)}
                                        </span>
                                        <span className="text-white/90 text-xs">
                                          kg CO₂e
                                        </span>
                                      </div>
                                    </Col>
                                    <Col span={8}>
                                      <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 border border-white/25">
                                        <span className="text-white text-xs font-medium block mb-1">
                                          Material
                                        </span>
                                        <span className="text-white text-xl font-bold block">
                                          {(
                                            totalEmission?.material_value || 0
                                          ).toFixed(4)}
                                        </span>
                                        <span className="text-white/90 text-xs">
                                          kg CO₂e
                                        </span>
                                      </div>
                                    </Col>
                                    <Col span={8}>
                                      <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 border border-white/25">
                                        <span className="text-white text-xs font-medium block mb-1">
                                          Waste
                                        </span>
                                        <span className="text-white text-xl font-bold block">
                                          {(
                                            totalEmission?.waste_value || 0
                                          ).toFixed(4)}
                                        </span>
                                        <span className="text-white/90 text-xs">
                                          kg CO₂e
                                        </span>
                                      </div>
                                    </Col>
                                    <Col span={8}>
                                      <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 border border-white/25">
                                        <span className="text-white text-xs font-medium block mb-1">
                                          Logistics
                                        </span>
                                        <span className="text-white text-xl font-bold block">
                                          {(
                                            totalEmission?.logistic_value || 0
                                          ).toFixed(4)}
                                        </span>
                                        <span className="text-white/90 text-xs">
                                          kg CO₂e
                                        </span>
                                      </div>
                                    </Col>
                                    <Col span={8}>
                                      <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 border border-white/25">
                                        <span className="text-white text-xs font-medium block mb-1">
                                          Packaging
                                        </span>
                                        <span className="text-white text-xl font-bold block">
                                          {(
                                            totalEmission?.packaging_value || 0
                                          ).toFixed(4)}
                                        </span>
                                        <span className="text-white/90 text-xs">
                                          kg CO₂e
                                        </span>
                                      </div>
                                    </Col>
                                    <Col span={8}>
                                      <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 border border-white/25">
                                        <span className="text-white text-xs font-medium block mb-1">
                                          Production
                                        </span>
                                        <span className="text-white text-xl font-bold block">
                                          {(
                                            totalEmission?.production_value || 0
                                          ).toFixed(4)}
                                        </span>
                                        <span className="text-white/90 text-xs">
                                          kg CO₂e
                                        </span>
                                      </div>
                                    </Col>
                                  </Row>
                                </div>
                              </div>

                              {/* Emission Categories */}
                              <div className="!space-y-4">
                                {/* Material Emissions */}
                                {materialEmissions.length > 0 && (
                                  <Collapse
                                    defaultActiveKey={["material"]}
                                    className="bg-white rounded-xl border border-gray-100 shadow-sm"
                                    expandIconPosition="end"
                                    items={[
                                      {
                                        key: "material",
                                        label: (
                                          <div className="flex items-center justify-between w-full pr-4">
                                            <div className="flex items-center gap-3">
                                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                                <span className="text-white text-sm font-bold">
                                                  M
                                                </span>
                                              </div>
                                              <div>
                                                <Text strong className="block">
                                                  Material Emissions
                                                </Text>
                                                <Text
                                                  type="secondary"
                                                  className="text-xs"
                                                >
                                                  {materialEmissions.length}{" "}
                                                  materials analyzed
                                                </Text>
                                              </div>
                                            </div>
                                            <Tag
                                              color="blue"
                                              className="rounded-full px-3 ml-4"
                                            >
                                              {totalEmission?.material_value?.toFixed(
                                                4,
                                              )}{" "}
                                              kg CO₂e
                                            </Tag>
                                          </div>
                                        ),
                                        children: (
                                          <Table
                                            dataSource={materialEmissions}
                                            rowKey="id"
                                            size="middle"
                                            pagination={false}
                                            className="rounded-lg overflow-hidden"
                                            columns={[
                                              {
                                                title: "Material Type",
                                                dataIndex: "material_type",
                                                key: "material_type",
                                                render: (text: string) => (
                                                  <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                                                      <span className="text-blue-600 text-xs font-semibold">
                                                        {text?.charAt(0)}
                                                      </span>
                                                    </div>
                                                    <Text strong>{text}</Text>
                                                  </div>
                                                ),
                                              },
                                              {
                                                title: "Composition",
                                                dataIndex:
                                                  "material_composition",
                                                key: "material_composition",
                                                align: "center" as const,
                                                render: (val: number) => (
                                                  <Tag className="rounded-full">
                                                    {val}%
                                                  </Tag>
                                                ),
                                              },
                                              {
                                                title: "Weight (kg)",
                                                dataIndex:
                                                  "material_composition_weight",
                                                key: "material_composition_weight",
                                                align: "right" as const,
                                                render: (val: number) => (
                                                  <Text className="font-mono">
                                                    {val?.toFixed(6)}
                                                  </Text>
                                                ),
                                              },
                                              {
                                                title: "Emission Factor",
                                                dataIndex:
                                                  "material_emission_factor",
                                                key: "material_emission_factor",
                                                align: "right" as const,
                                                render: (val: number) => (
                                                  <Text className="font-mono">
                                                    {val?.toFixed(2)}
                                                  </Text>
                                                ),
                                              },
                                              {
                                                title: "Emission",
                                                dataIndex: "material_emission",
                                                key: "material_emission",
                                                align: "right" as const,
                                                render: (val: number) => (
                                                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-50 text-blue-700 font-semibold text-sm">
                                                    {val?.toFixed(6)}
                                                    <span className="text-blue-400 text-xs font-normal">
                                                      kg CO₂e
                                                    </span>
                                                  </span>
                                                ),
                                              },
                                            ]}
                                          />
                                        ),
                                      },
                                    ]}
                                  />
                                )}

                                {/* Logistics Emission */}
                                {logisticEmission && (
                                  <Collapse
                                    className="bg-white rounded-xl border border-gray-100 shadow-sm"
                                    expandIconPosition="end"
                                    items={[
                                      {
                                        key: "logistics",
                                        label: (
                                          <div className="flex items-center justify-between w-full pr-4">
                                            <div className="flex items-center gap-3">
                                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                                                <span className="text-white text-sm font-bold">
                                                  L
                                                </span>
                                              </div>
                                              <div>
                                                <Text strong className="block">
                                                  Logistics Emission
                                                </Text>
                                                <Text
                                                  type="secondary"
                                                  className="text-xs"
                                                >
                                                  Transport and distribution
                                                </Text>
                                              </div>
                                            </div>
                                            <Tag
                                              color="orange"
                                              className="rounded-full px-3 ml-4"
                                            >
                                              {logisticEmission.leg_wise_transport_emissions_per_unit_kg_co2e?.toFixed(
                                                4,
                                              )}{" "}
                                              kg CO₂e
                                            </Tag>
                                          </div>
                                        ),
                                        children: (
                                          <Row gutter={[16, 16]}>
                                            <Col span={8}>
                                              <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-xl border border-orange-100">
                                                <Text
                                                  type="secondary"
                                                  className="block text-xs mb-2 uppercase tracking-wide"
                                                >
                                                  Mode of Transport
                                                </Text>
                                                <Text
                                                  strong
                                                  className="text-orange-700"
                                                >
                                                  {logisticEmission.mode_of_transport ||
                                                    "-"}
                                                </Text>
                                              </div>
                                            </Col>
                                            <Col span={8}>
                                              <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-xl border border-orange-100">
                                                <Text
                                                  type="secondary"
                                                  className="block text-xs mb-2 uppercase tracking-wide"
                                                >
                                                  Distance
                                                </Text>
                                                <Text
                                                  strong
                                                  className="text-orange-700"
                                                >
                                                  {logisticEmission.distance_km}{" "}
                                                  km
                                                </Text>
                                              </div>
                                            </Col>
                                            <Col span={8}>
                                              <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-xl border border-orange-100">
                                                <Text
                                                  type="secondary"
                                                  className="block text-xs mb-2 uppercase tracking-wide"
                                                >
                                                  Mass Transported
                                                </Text>
                                                <Text
                                                  strong
                                                  className="text-orange-700"
                                                >
                                                  {
                                                    logisticEmission.mass_transported_kg
                                                  }{" "}
                                                  kg
                                                </Text>
                                              </div>
                                            </Col>
                                            <Col span={12}>
                                              <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-xl border border-orange-100">
                                                <Text
                                                  type="secondary"
                                                  className="block text-xs mb-2 uppercase tracking-wide"
                                                >
                                                  Emission Factor
                                                </Text>
                                                <Text
                                                  strong
                                                  className="text-orange-700"
                                                >
                                                  {
                                                    logisticEmission.transport_mode_emission_factor_value_kg_co2e_t_km
                                                  }{" "}
                                                  kg CO₂e/t·km
                                                </Text>
                                              </div>
                                            </Col>
                                            <Col span={12}>
                                              <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-4 rounded-xl text-white">
                                                <Text className="block text-xs mb-2 uppercase tracking-wide text-white/80">
                                                  Transport Emission
                                                </Text>
                                                <Text
                                                  strong
                                                  className="text-white text-lg"
                                                >
                                                  {logisticEmission.leg_wise_transport_emissions_per_unit_kg_co2e?.toFixed(
                                                    6,
                                                  )}{" "}
                                                  kg CO₂e
                                                </Text>
                                              </div>
                                            </Col>
                                          </Row>
                                        ),
                                      },
                                    ]}
                                  />
                                )}

                                {/* Packaging Emission */}
                                {packagingEmission && (
                                  <Collapse
                                    className="bg-white rounded-xl border border-gray-100 shadow-sm"
                                    expandIconPosition="end"
                                    items={[
                                      {
                                        key: "packaging",
                                        label: (
                                          <div className="flex items-center justify-between w-full pr-4">
                                            <div className="flex items-center gap-3">
                                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                                                <span className="text-white text-sm font-bold">
                                                  P
                                                </span>
                                              </div>
                                              <div>
                                                <Text strong className="block">
                                                  Packaging Emission
                                                </Text>
                                                <Text
                                                  type="secondary"
                                                  className="text-xs"
                                                >
                                                  Materials and processes
                                                </Text>
                                              </div>
                                            </div>
                                            <Tag
                                              color="purple"
                                              className="rounded-full px-3 ml-4"
                                            >
                                              {totalEmission?.packaging_value?.toFixed(
                                                4,
                                              )}{" "}
                                              kg CO₂e
                                            </Tag>
                                          </div>
                                        ),
                                        children: (
                                          <Row gutter={[16, 16]}>
                                            <Col span={8}>
                                              <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-4 rounded-xl border border-purple-100">
                                                <Text
                                                  type="secondary"
                                                  className="block text-xs mb-2 uppercase tracking-wide"
                                                >
                                                  Packaging Type
                                                </Text>
                                                <Text
                                                  strong
                                                  className="text-purple-700"
                                                >
                                                  {packagingEmission.packaging_type ||
                                                    "-"}
                                                </Text>
                                              </div>
                                            </Col>
                                            <Col span={8}>
                                              <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-4 rounded-xl border border-purple-100">
                                                <Text
                                                  type="secondary"
                                                  className="block text-xs mb-2 uppercase tracking-wide"
                                                >
                                                  Pack Weight
                                                </Text>
                                                <Text
                                                  strong
                                                  className="text-purple-700"
                                                >
                                                  {
                                                    packagingEmission.pack_weight_kg
                                                  }{" "}
                                                  kg
                                                </Text>
                                              </div>
                                            </Col>
                                            <Col span={8}>
                                              <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-4 rounded-xl border border-purple-100">
                                                <Text
                                                  type="secondary"
                                                  className="block text-xs mb-2 uppercase tracking-wide"
                                                >
                                                  Emission Factor
                                                </Text>
                                                <Text
                                                  strong
                                                  className="text-purple-700"
                                                >
                                                  {
                                                    packagingEmission.emission_factor_box_kg
                                                  }{" "}
                                                  kg CO₂e/kg
                                                </Text>
                                              </div>
                                            </Col>
                                          </Row>
                                        ),
                                      },
                                    ]}
                                  />
                                )}

                                {/* Production Emission */}
                                {productionEmission && (
                                  <Collapse
                                    className="bg-white rounded-xl border border-gray-100 shadow-sm"
                                    expandIconPosition="end"
                                    items={[
                                      {
                                        key: "production",
                                        label: (
                                          <div className="flex items-center justify-between w-full pr-4">
                                            <div className="flex items-center gap-3">
                                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                                                <span className="text-white text-sm font-bold">
                                                  Pr
                                                </span>
                                              </div>
                                              <div>
                                                <Text strong className="block">
                                                  Production Emission
                                                </Text>
                                                <Text
                                                  type="secondary"
                                                  className="text-xs"
                                                >
                                                  Manufacturing processes
                                                </Text>
                                              </div>
                                            </div>
                                            <Tag
                                              color="cyan"
                                              className="rounded-full px-3 ml-4"
                                            >
                                              {totalEmission?.production_value?.toFixed(
                                                4,
                                              )}{" "}
                                              kg CO₂e
                                            </Tag>
                                          </div>
                                        ),
                                        children: (
                                          <Row gutter={[16, 16]}>
                                            <Col span={8}>
                                              <div className="bg-gradient-to-br from-cyan-50 to-teal-50 p-4 rounded-xl border border-cyan-100">
                                                <Text
                                                  type="secondary"
                                                  className="block text-xs mb-2 uppercase tracking-wide"
                                                >
                                                  Allocation Methodology
                                                </Text>
                                                <Text
                                                  strong
                                                  className="text-cyan-700 text-sm"
                                                >
                                                  {productionEmission.allocation_methodology ||
                                                    "-"}
                                                </Text>
                                              </div>
                                            </Col>
                                            <Col span={8}>
                                              <div className="bg-gray-50 p-3 rounded-lg">
                                                <Text
                                                  type="secondary"
                                                  className="block text-xs mb-1"
                                                >
                                                  Component Weight
                                                </Text>
                                                <Text strong>
                                                  {
                                                    productionEmission.component_weight_kg
                                                  }{" "}
                                                  kg
                                                </Text>
                                              </div>
                                            </Col>
                                            <Col span={8}>
                                              <div className="bg-gray-50 p-3 rounded-lg">
                                                <Text
                                                  type="secondary"
                                                  className="block text-xs mb-1"
                                                >
                                                  Products Produced
                                                </Text>
                                                <Text strong>
                                                  {
                                                    productionEmission.no_of_products_current_component_produced
                                                  }
                                                </Text>
                                              </div>
                                            </Col>
                                            <Col span={12}>
                                              <div className="bg-gray-50 p-3 rounded-lg">
                                                <Text
                                                  type="secondary"
                                                  className="block text-xs mb-1"
                                                >
                                                  Total Weight at Factory Level
                                                </Text>
                                                <Text strong>
                                                  {
                                                    productionEmission.total_weight_produced_at_factory_level_kg
                                                  }{" "}
                                                  kg
                                                </Text>
                                              </div>
                                            </Col>
                                            <Col span={12}>
                                              <div className="bg-gray-50 p-3 rounded-lg">
                                                <Text
                                                  type="secondary"
                                                  className="block text-xs mb-1"
                                                >
                                                  Component Weight Produced
                                                </Text>
                                                <Text strong>
                                                  {
                                                    productionEmission.total_weight_of_current_component_produced_kg
                                                  }{" "}
                                                  kg
                                                </Text>
                                              </div>
                                            </Col>
                                          </Row>
                                        ),
                                      },
                                    ]}
                                  />
                                )}

                                {/* Waste Emission */}
                                {wasteEmission && (
                                  <Collapse
                                    className="bg-white rounded-xl border border-gray-100 shadow-sm"
                                    expandIconPosition="end"
                                    items={[
                                      {
                                        key: "waste",
                                        label: (
                                          <div className="flex items-center justify-between w-full pr-4">
                                            <div className="flex items-center gap-3">
                                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/20">
                                                <span className="text-white text-sm font-bold">
                                                  W
                                                </span>
                                              </div>
                                              <div>
                                                <Text strong className="block">
                                                  Waste Emission
                                                </Text>
                                                <Text
                                                  type="secondary"
                                                  className="text-xs"
                                                >
                                                  Disposal and treatment
                                                </Text>
                                              </div>
                                            </div>
                                            <Tag
                                              color="red"
                                              className="rounded-full px-3 ml-4"
                                            >
                                              {totalEmission?.waste_value?.toFixed(
                                                4,
                                              )}{" "}
                                              kg CO₂e
                                            </Tag>
                                          </div>
                                        ),
                                        children: (
                                          <Row gutter={[16, 16]}>
                                            <Col span={8}>
                                              <div className="bg-gradient-to-br from-red-50 to-rose-50 p-4 rounded-xl border border-red-100">
                                                <Text
                                                  type="secondary"
                                                  className="block text-xs mb-2 uppercase tracking-wide"
                                                >
                                                  Waste per Box
                                                </Text>
                                                <Text
                                                  strong
                                                  className="text-red-700"
                                                >
                                                  {
                                                    wasteEmission.waste_generated_per_box_kg
                                                  }{" "}
                                                  kg
                                                </Text>
                                              </div>
                                            </Col>
                                            <Col span={8}>
                                              <div className="bg-gradient-to-br from-red-50 to-rose-50 p-4 rounded-xl border border-red-100">
                                                <Text
                                                  type="secondary"
                                                  className="block text-xs mb-2 uppercase tracking-wide"
                                                >
                                                  Box Treatment EF
                                                </Text>
                                                <Text
                                                  strong
                                                  className="text-red-700"
                                                >
                                                  {
                                                    wasteEmission.emission_factor_box_waste_treatment_kg_co2e_kg
                                                  }{" "}
                                                  kg CO₂e/kg
                                                </Text>
                                              </div>
                                            </Col>
                                            <Col span={8}>
                                              <div className="bg-gradient-to-br from-red-50 to-rose-50 p-4 rounded-xl border border-red-100">
                                                <Text
                                                  type="secondary"
                                                  className="block text-xs mb-2 uppercase tracking-wide"
                                                >
                                                  Packaging Treatment EF
                                                </Text>
                                                <Text
                                                  strong
                                                  className="text-red-700"
                                                >
                                                  {
                                                    wasteEmission.emission_factor_packaging_waste_treatment_kg_co2e_kwh
                                                  }{" "}
                                                  kg CO₂e/kWh
                                                </Text>
                                              </div>
                                            </Col>
                                          </Row>
                                        ),
                                      },
                                    ]}
                                  />
                                )}

                                {/* Allocation Methodology */}
                                {allocation && (
                                  <Collapse
                                    className="bg-white rounded-xl border border-gray-100 shadow-sm"
                                    expandIconPosition="end"
                                    items={[
                                      {
                                        key: "allocation",
                                        label: (
                                          <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center shadow-lg shadow-slate-500/20">
                                              <span className="text-white text-sm font-bold">
                                                A
                                              </span>
                                            </div>
                                            <div>
                                              <Text strong className="block">
                                                Allocation Methodology
                                              </Text>
                                              <Text
                                                type="secondary"
                                                className="text-xs"
                                              >
                                                Calculation methods applied
                                              </Text>
                                            </div>
                                          </div>
                                        ),
                                        children: (
                                          <Row gutter={[16, 16]}>
                                            <Col span={8}>
                                              <div className="bg-gradient-to-br from-slate-50 to-gray-100 p-4 rounded-xl border border-slate-100">
                                                <Text
                                                  type="secondary"
                                                  className="block text-xs mb-2 uppercase tracking-wide"
                                                >
                                                  ER Less Than Five
                                                </Text>
                                                <Text
                                                  strong
                                                  className="text-slate-700"
                                                >
                                                  {allocation.check_er_less_than_five ||
                                                    "-"}
                                                </Text>
                                              </div>
                                            </Col>
                                            <Col span={8}>
                                              <div className="bg-gradient-to-br from-slate-50 to-gray-100 p-4 rounded-xl border border-slate-100">
                                                <Text
                                                  type="secondary"
                                                  className="block text-xs mb-2 uppercase tracking-wide"
                                                >
                                                  Physical Mass
                                                </Text>
                                                <Text
                                                  strong
                                                  className="text-slate-700"
                                                >
                                                  {allocation.phy_mass_allocation_er_less_than_five ||
                                                    "-"}
                                                </Text>
                                              </div>
                                            </Col>
                                            <Col span={8}>
                                              <div className="bg-gradient-to-br from-slate-50 to-gray-100 p-4 rounded-xl border border-slate-100">
                                                <Text
                                                  type="secondary"
                                                  className="block text-xs mb-2 uppercase tracking-wide"
                                                >
                                                  Economic (ER &gt; 5)
                                                </Text>
                                                <Text
                                                  strong
                                                  className="text-slate-700"
                                                >
                                                  {allocation.econ_allocation_er_greater_than_five ||
                                                    "-"}
                                                </Text>
                                              </div>
                                            </Col>
                                            <Col span={12}>
                                              <div className="bg-gradient-to-br from-slate-50 to-gray-100 p-4 rounded-xl border border-slate-100">
                                                <Text
                                                  type="secondary"
                                                  className="block text-xs mb-2 uppercase tracking-wide"
                                                >
                                                  Split Allocation
                                                </Text>
                                                <Tag
                                                  color={
                                                    allocation.split_allocation
                                                      ? "green"
                                                      : "default"
                                                  }
                                                  className="rounded-full"
                                                >
                                                  {allocation.split_allocation
                                                    ? "Enabled"
                                                    : "Disabled"}
                                                </Tag>
                                              </div>
                                            </Col>
                                            <Col span={12}>
                                              <div className="bg-gradient-to-br from-slate-50 to-gray-100 p-4 rounded-xl border border-slate-100">
                                                <Text
                                                  type="secondary"
                                                  className="block text-xs mb-2 uppercase tracking-wide"
                                                >
                                                  System Expansion
                                                </Text>
                                                <Tag
                                                  color={
                                                    allocation.sys_expansion_allocation
                                                      ? "green"
                                                      : "default"
                                                  }
                                                  className="rounded-full"
                                                >
                                                  {allocation.sys_expansion_allocation
                                                    ? "Enabled"
                                                    : "Disabled"}
                                                </Tag>
                                              </div>
                                            </Col>
                                          </Row>
                                        ),
                                      },
                                    ]}
                                  />
                                )}
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    )}
                </div>
              )}

              {/* No own_emission data */}
              {(!product?.own_emission ||
                product.own_emission.length === 0) && (
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-8 text-center">
                  <div className="w-16 h-16 mx-auto bg-emerald-100 rounded-2xl flex items-center justify-center mb-4">
                    <Info className="text-emerald-300 w-8 h-8" />
                  </div>
                  <Text type="secondary" className="block text-lg">
                    No PCF data available
                  </Text>
                  <Text type="secondary" className="text-sm mt-1 block">
                    Create a PCF request to start tracking emissions for this
                    product.
                  </Text>
                </div>
              )}
            </div>

            {/* Contact Form Card - Only shown when Contact Team is clicked */}
            {dataEntryMethod === "contact" && (
              <Card
                className="shadow-sm rounded-xl"
                title="Contact Enviguide Team"
                extra={
                  <Button
                    type="text"
                    icon={<X size={16} />}
                    onClick={() => setDataEntryMethod("questionnaire")}
                  />
                }
              >
                <Row gutter={24} className="mb-6">
                  <Col span={12}>
                    <div>
                      <Text strong className="block mb-2">
                        Full Name<span className="text-red-500">*</span>
                      </Text>
                      <Input
                        value={contactFullName}
                        onChange={(e) => {
                          setContactFullName(e.target.value);
                          if (contactErrors.fullName) {
                            setContactErrors((prev) => ({
                              ...prev,
                              fullName: undefined,
                            }));
                          }
                        }}
                        placeholder="John Doe"
                        size="large"
                        status={contactErrors.fullName ? "error" : undefined}
                      />
                      {contactErrors.fullName && (
                        <Text type="danger" className="text-xs mt-1 block">
                          {contactErrors.fullName}
                        </Text>
                      )}
                    </div>
                  </Col>
                  <Col span={12}>
                    <div>
                      <Text strong className="block mb-2">
                        Phone Number<span className="text-red-500">*</span>
                      </Text>
                      <Input
                        value={contactPhone}
                        onChange={(e) => {
                          setContactPhone(e.target.value);
                          if (contactErrors.phone) {
                            setContactErrors((prev) => ({
                              ...prev,
                              phone: undefined,
                            }));
                          }
                        }}
                        placeholder="+1 (555) 123-4567"
                        size="large"
                        status={contactErrors.phone ? "error" : undefined}
                      />
                      {contactErrors.phone && (
                        <Text type="danger" className="text-xs mt-1 block">
                          {contactErrors.phone}
                        </Text>
                      )}
                    </div>
                  </Col>
                  <Col span={24}>
                    <div className="mb-4 mt-4">
                      <Text strong className="block mb-2">
                        Email Address<span className="text-red-500">*</span>
                      </Text>
                      <Input
                        value={contactEmail}
                        onChange={(e) => {
                          setContactEmail(e.target.value);
                          if (contactErrors.email) {
                            setContactErrors((prev) => ({
                              ...prev,
                              email: undefined,
                            }));
                          }
                        }}
                        placeholder="john.doe@company.com"
                        size="large"
                        type="email"
                        status={contactErrors.email ? "error" : undefined}
                      />
                      {contactErrors.email && (
                        <Text type="danger" className="text-xs mt-1 block">
                          {contactErrors.email}
                        </Text>
                      )}
                    </div>
                  </Col>
                  <Col span={24}>
                    <div className="mb-4">
                      <Text strong className="block mb-2">
                        Message
                      </Text>
                      <TextArea
                        value={contactMessage}
                        onChange={(e) => setContactMessage(e.target.value)}
                        rows={4}
                        placeholder="Please provide details about your emission calculation needs and any specific questions you have..."
                      />
                    </div>
                  </Col>
                </Row>

                {/* Product Info Summary */}
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <Row gutter={16}>
                    <Col span={6}>
                      <Text type="secondary" className="block text-xs">
                        Product:
                      </Text>
                      <Text strong>{product?.product_code || "-"}</Text>
                    </Col>
                    <Col span={6}>
                      <Text type="secondary" className="block text-xs">
                        Category:
                      </Text>
                      <Text strong>{product?.category_name || "-"}</Text>
                    </Col>
                    <Col span={6}>
                      <Text type="secondary" className="block text-xs">
                        Status:
                      </Text>
                      <Tag color="orange">Pending</Tag>
                    </Col>
                    <Col span={6}>
                      <Text type="secondary" className="block text-xs">
                        Date:
                      </Text>
                      <Text strong>{dayjs().format("M/D/YYYY")}</Text>
                    </Col>
                  </Row>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                  <Button
                    type="primary"
                    size="large"
                    icon={<Send size={16} />}
                    className="bg-emerald-500 hover:bg-emerald-600 border-0 rounded-xl shadow-lg shadow-emerald-500/25"
                    onClick={handleSubmitContactRequest}
                    loading={ownEmissionLoading}
                  >
                    Submit Request
                  </Button>
                </div>
              </Card>
            )}
          </Col>

          {/* Sidebar */}
          <Col xs={24} lg={8}>
            <div className="flex flex-col gap-6">
              {/* Product Summary */}
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-white">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center shadow-lg shadow-slate-500/20">
                      <Package className="w-4 h-4 text-white" />
                    </div>
                    <Text strong className="text-base">
                      Product Summary
                    </Text>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between py-2 border-b border-gray-50">
                    <Text type="secondary" className="text-sm">
                      Product Code
                    </Text>
                    <Tag className="bg-slate-100 border-0 text-slate-700 font-mono">
                      {product?.product_code || "-"}
                    </Tag>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-50">
                    <Text type="secondary" className="text-sm">
                      Name
                    </Text>
                    <Text strong className="text-sm">
                      {product?.product_name || "-"}
                    </Text>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-50">
                    <Text type="secondary" className="text-sm">
                      Category
                    </Text>
                    <Text strong className="text-sm">
                      {product?.category_name || "-"}
                    </Text>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-50">
                    <Text type="secondary" className="text-sm">
                      Sub-Category
                    </Text>
                    <Text strong className="text-sm">
                      {product?.sub_category_name || "-"}
                    </Text>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-50">
                    <Text type="secondary" className="text-sm">
                      Manufacturer
                    </Text>
                    <Text strong className="text-sm">
                      {product?.ts_supplier || "-"}
                    </Text>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-50">
                    <Text type="secondary" className="text-sm">
                      Weight
                    </Text>
                    <Text strong className="text-sm">
                      {product?.ts_weight_kg || "-"} kg
                    </Text>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-50">
                    <Text type="secondary" className="text-sm">
                      Material
                    </Text>
                    <Text strong className="text-sm">
                      {product?.ts_material || "-"}
                    </Text>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <Text type="secondary" className="text-sm">
                      Created
                    </Text>
                    <Text strong className="text-sm">
                      {product?.created_date
                        ? dayjs(product.created_date).format("DD MMM YYYY")
                        : "-"}
                    </Text>
                  </div>
                </div>
              </div>

              {/* Emission Summary */}
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                        <BarChart3 className="text-white w-5 h-5" />
                      </div>
                      <Text strong className="text-base text-gray-900">
                        Emission Summary
                      </Text>
                    </div>
                    <Tag
                      color={
                        calculateTotalEmissions().hasData ? "green" : "orange"
                      }
                      className="rounded-full"
                    >
                      {calculateTotalEmissions().hasData
                        ? "Calculated"
                        : "Pending"}
                    </Tag>
                  </div>
                </div>
                <div className="p-5">
                  {(() => {
                    const emissions = calculateTotalEmissions();

                    if (emissions.hasData) {
                      // Show PCF emission breakdown
                      return (
                        <div className="space-y-5">
                          {/* Total PCF Hero */}
                          <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-5 text-white text-center">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                            <Text className="!text-white/80 text-xs block mb-1">
                              Total PCF Value
                            </Text>
                            <div className="flex items-baseline justify-center gap-2">
                              <span className="text-3xl font-bold">
                                {emissions.total}
                              </span>
                              <span className="text-white/70 text-sm">
                                kg CO₂e
                              </span>
                            </div>
                          </div>

                          {/* Emission Bars */}
                          <div className="space-y-4">
                            <div>
                              <div className="flex justify-between items-center mb-1.5">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                  <Text className="text-sm font-medium">
                                    Material
                                  </Text>
                                </div>
                                <Text className="text-sm text-blue-600 font-semibold">
                                  {emissions.materialPercent}%
                                </Text>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-2">
                                <div
                                  className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full transition-all"
                                  style={{
                                    width: `${emissions.materialPercent}%`,
                                  }}
                                ></div>
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between items-center mb-1.5">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                  <Text className="text-sm font-medium">
                                    Waste
                                  </Text>
                                </div>
                                <Text className="text-sm text-red-600 font-semibold">
                                  {emissions.wastePercent}%
                                </Text>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-2">
                                <div
                                  className="bg-gradient-to-r from-red-400 to-red-600 h-2 rounded-full transition-all"
                                  style={{
                                    width: `${emissions.wastePercent}%`,
                                  }}
                                ></div>
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between items-center mb-1.5">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                                  <Text className="text-sm font-medium">
                                    Logistics
                                  </Text>
                                </div>
                                <Text className="text-sm text-orange-600 font-semibold">
                                  {emissions.logisticPercent}%
                                </Text>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-2">
                                <div
                                  className="bg-gradient-to-r from-orange-400 to-orange-600 h-2 rounded-full transition-all"
                                  style={{
                                    width: `${emissions.logisticPercent}%`,
                                  }}
                                ></div>
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between items-center mb-1.5">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                                  <Text className="text-sm font-medium">
                                    Packaging
                                  </Text>
                                </div>
                                <Text className="text-sm text-purple-600 font-semibold">
                                  {emissions.packagingPercent}%
                                </Text>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-2">
                                <div
                                  className="bg-gradient-to-r from-purple-400 to-purple-600 h-2 rounded-full transition-all"
                                  style={{
                                    width: `${emissions.packagingPercent}%`,
                                  }}
                                ></div>
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between items-center mb-1.5">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
                                  <Text className="text-sm font-medium">
                                    Production
                                  </Text>
                                </div>
                                <Text className="text-sm text-cyan-600 font-semibold">
                                  {emissions.productionPercent}%
                                </Text>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-2">
                                <div
                                  className="bg-gradient-to-r from-cyan-400 to-cyan-600 h-2 rounded-full transition-all"
                                  style={{
                                    width: `${emissions.productionPercent}%`,
                                  }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // Show pending state when no PCF data
                    return (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 mx-auto bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
                          <BarChart3 className="text-emerald-300 w-8 h-8" />
                        </div>
                        <Text className="block text-gray-500 font-medium">
                          No emission data yet
                        </Text>
                        <Text type="secondary" className="text-xs mt-1 block">
                          Select a PCF with completed calculations
                        </Text>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Help & Resources */}
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                      <svg
                        className="w-4 h-4 text-white"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                      </svg>
                    </div>
                    <Text strong className="text-base">
                      Help & Resources
                    </Text>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <div className="group flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl cursor-pointer hover:from-blue-100 hover:to-indigo-100 transition-all border border-blue-100 hover:border-blue-200">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <Text
                        strong
                        className="block text-blue-800 group-hover:text-blue-900"
                      >
                        Calculation Guide
                      </Text>
                      <Text className="text-xs text-blue-600">
                        Learn emission calculation methods
                      </Text>
                    </div>
                  </div>
                  <div className="group flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl cursor-pointer hover:from-purple-100 hover:to-violet-100 transition-all border border-purple-100 hover:border-purple-200">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                      <svg
                        className="w-5 h-5 text-white"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                      </svg>
                    </div>
                    <div>
                      <Text
                        strong
                        className="block text-purple-800 group-hover:text-purple-900"
                      >
                        Emission Factors
                      </Text>
                      <Text className="text-xs text-purple-600">
                        Find appropriate factors
                      </Text>
                    </div>
                  </div>
                  <div className="group flex items-center gap-3 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl cursor-pointer hover:from-emerald-100 hover:to-teal-100 transition-all border border-emerald-100 hover:border-emerald-200">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                      <Share2 className="text-white w-5 h-5" />
                    </div>
                    <div>
                      <Text
                        strong
                        className="block text-emerald-800 group-hover:text-emerald-900"
                      >
                        Contact Support
                      </Text>
                      <Text className="text-xs text-emerald-600">
                        Get expert assistance
                      </Text>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      ),
    },
    {
      key: "4",
      label: (
        <span className="flex items-center gap-2 px-1">
          <FileBarChart className="w-4 h-4" />
          PCF
        </span>
      ),
      children: (
        <div className="flex gap-6 p-6">
          {/* Left Sidebar - PCF Management */}
          <div className="w-72 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden sticky top-6">
              <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <Text strong className="text-base text-gray-900">
                    PCF Management
                  </Text>
                </div>
              </div>
              <div className="p-3 flex flex-col gap-1">
                <div
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${
                    pcfActiveMenu === "linked-secondary"
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20"
                      : "hover:bg-gray-50 text-gray-600"
                  }`}
                  onClick={() => {
                    setPcfActiveMenu("linked-secondary");
                    // Auto-select first PCF if available
                    if (
                      bomPcfDropdown.length > 0 &&
                      !secondaryDataSelectedPcf
                    ) {
                      const firstPcfId = bomPcfDropdown[0].id;
                      setSecondaryDataSelectedPcf(firstPcfId);
                      if (product?.product_code) {
                        fetchSecondaryDataEntries(
                          firstPcfId,
                          product.product_code,
                        );
                      }
                    }
                  }}
                >
                  <Database
                    className={`w-4 h-4 ${pcfActiveMenu === "linked-secondary" ? "!text-white" : ""}`}
                  />
                  <div>
                    <Text
                      className={`block font-medium ${pcfActiveMenu === "linked-secondary" ? "!text-white" : "text-gray-700"}`}
                    >
                      Secondary Data
                    </Text>
                    <Text
                      className={`text-xs ${pcfActiveMenu === "linked-secondary" ? "!text-white/70" : "text-gray-400"}`}
                    >
                      Linked data sources
                    </Text>
                  </div>
                </div>
                <div
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${
                    pcfActiveMenu === "manage-pcf"
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500 !text-white shadow-lg shadow-emerald-500/20"
                      : "hover:bg-gray-50 text-gray-600"
                  }`}
                  onClick={() => setPcfActiveMenu("manage-pcf")}
                >
                  <Settings
                    className={`w-4 h-4 ${pcfActiveMenu === "manage-pcf" ? "!text-white" : ""}`}
                  />
                  <div>
                    <Text
                      className={`block font-medium ${pcfActiveMenu === "manage-pcf" ? "!text-white" : "text-gray-700"}`}
                    >
                      Manage PCF
                    </Text>
                    <Text
                      className={`text-xs ${pcfActiveMenu === "manage-pcf" ? "!text-white/70" : "text-gray-400"}`}
                    >
                      Request management
                    </Text>
                  </div>
                </div>
                <div
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${
                    pcfActiveMenu === "pcf-overview"
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500 !text-white shadow-lg shadow-emerald-500/20"
                      : "hover:bg-gray-50 text-gray-600"
                  }`}
                  onClick={() => setPcfActiveMenu("pcf-overview")}
                >
                  <BarChart3
                    className={`w-4 h-4 ${pcfActiveMenu === "pcf-overview" ? "!text-white" : ""}`}
                  />
                  <div>
                    <Text
                      className={`block font-medium ${pcfActiveMenu === "pcf-overview" ? "!text-white" : "text-gray-700"}`}
                    >
                      PCF Overview
                    </Text>
                    <Text
                      className={`text-xs ${pcfActiveMenu === "pcf-overview" ? "!text-white/70" : "text-gray-400"}`}
                    >
                      Summary & analytics
                    </Text>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            {/* PCF Overview View */}
            {pcfActiveMenu === "pcf-overview" && (
              <div className="flex flex-col gap-6">
                <Row gutter={24}>
                  {/* Active PCF Card */}
                  <Col xs={24} lg={12}>
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden h-full">
                      <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                              <Activity className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <Text
                                strong
                                className="text-base text-gray-900 block"
                              >
                                Active PCF
                              </Text>
                              <Text type="secondary" className="text-xs">
                                Current version
                              </Text>
                            </div>
                          </div>
                          <Tag color="green" className="rounded-full px-3">
                            {pcfHistoryData[0]?.model_version || "v1.0"} Active
                          </Tag>
                        </div>
                      </div>
                      <div className="p-5">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Avatar
                              size="small"
                              className="bg-gradient-to-br from-amber-400 to-orange-500 text-white text-xs"
                            >
                              {pcfHistoryData[0]?.request_title
                                ?.charAt(0)
                                ?.toUpperCase() || "N"}
                            </Avatar>
                            <Text type="secondary" className="text-xs">
                              Last updated:{" "}
                              {pcfHistoryData[0]?.created_date
                                ? dayjs(pcfHistoryData[0].created_date).format(
                                    "DD MMM YYYY",
                                  )
                                : "-"}
                            </Text>
                          </div>
                        </div>
                        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 rounded-2xl p-8 text-center">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
                          <div className="relative z-10">
                            <span className="text-6xl font-bold text-white block">
                              {pcfHistoryData[0]?.overall_pcf?.toFixed(1) ||
                                "0.0"}
                            </span>
                            <span className="block mt-2 text-white text-lg">
                              kg CO₂e
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Col>

                  {/* PCF History / Own Emission */}
                  <Col xs={24} lg={12}>
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden h-full">
                      <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-white">
                        <div className="flex gap-4">
                          <button
                            className={`pb-2 px-1 text-sm font-medium transition-all border-b-2 ${
                              pcfHistoryTab === "history"
                                ? "border-emerald-500 text-emerald-600"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}
                            onClick={() => setPcfHistoryTab("history")}
                          >
                            PCF History
                          </button>
                          <button
                            className={`pb-2 px-1 text-sm font-medium transition-all border-b-2 ${
                              pcfHistoryTab === "own-emission"
                                ? "border-emerald-500 text-emerald-600"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}
                            onClick={() => setPcfHistoryTab("own-emission")}
                          >
                            Own Emission
                          </button>
                        </div>
                      </div>

                      <div className="p-5">
                        {pcfHistoryTab === "history" && (
                          <div>
                            {pcfHistoryLoading ? (
                              <div className="flex justify-center py-12">
                                <Spin size="default" />
                              </div>
                            ) : (
                              <div className="flex flex-col gap-3 max-h-[280px] overflow-y-auto custom-scrollbar">
                                {pcfHistoryData.map((item, index) => (
                                  <div
                                    key={item.id}
                                    className={`rounded-xl p-4 border transition-all ${
                                      index === 0
                                        ? "bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200"
                                        : "bg-gray-50 border-gray-100 hover:border-gray-200"
                                    }`}
                                  >
                                    <div className="flex justify-between items-start mb-2">
                                      <div className="flex items-center gap-2">
                                        <Tag
                                          color={
                                            index === 0 ? "green" : "default"
                                          }
                                          className="rounded-full px-3 text-xs m-0"
                                        >
                                          {item.model_version ||
                                            `v${pcfHistoryData.length - index}.0`}
                                          {index === 0 && " Active"}
                                        </Tag>
                                        <Text
                                          strong
                                          className={
                                            index === 0
                                              ? "text-emerald-700"
                                              : ""
                                          }
                                        >
                                          {item.overall_pcf?.toFixed(1) ||
                                            "0.0"}{" "}
                                          kg CO₂e
                                        </Text>
                                      </div>
                                      <Text
                                        type="secondary"
                                        className="text-xs"
                                      >
                                        {item.created_date
                                          ? dayjs(item.created_date).format(
                                              "MMM DD, YYYY",
                                            )
                                          : "-"}
                                      </Text>
                                    </div>
                                    <Text
                                      type="secondary"
                                      className="text-sm block mb-2"
                                    >
                                      {item.request_description ||
                                        "PCF calculation update"}
                                    </Text>
                                    <div className="flex items-center gap-2">
                                      <Avatar
                                        size="small"
                                        className={`${index === 0 ? "bg-gradient-to-br from-emerald-400 to-teal-500" : "bg-gray-300"} text-white text-xs`}
                                      >
                                        {item.request_title
                                          ?.charAt(0)
                                          ?.toUpperCase() || "U"}
                                      </Avatar>
                                      <Text
                                        type="secondary"
                                        className="text-xs"
                                      >
                                        {item.request_title || "User"}
                                      </Text>
                                    </div>
                                  </div>
                                ))}
                                {pcfHistoryData.length === 0 && (
                                  <div className="text-center py-12">
                                    <div className="w-14 h-14 mx-auto bg-emerald-50 rounded-2xl flex items-center justify-center mb-3">
                                      <History className="w-7 h-7 text-emerald-300" />
                                    </div>
                                    <Text className="text-gray-500 font-medium">
                                      No version history available
                                    </Text>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {pcfHistoryTab === "own-emission" && (
                          <div className="text-center py-12">
                            <div className="w-14 h-14 mx-auto bg-emerald-50 rounded-2xl flex items-center justify-center mb-3">
                              <Leaf className="w-7 h-7 text-emerald-300" />
                            </div>
                            <Text className="text-gray-500 font-medium">
                              Own emission data will be displayed here
                            </Text>
                          </div>
                        )}
                      </div>
                    </div>
                  </Col>
                </Row>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3">
                  <Button
                    type="primary"
                    icon={<Plus size={16} />}
                    className="bg-emerald-500 hover:bg-emerald-600 border-0 rounded-xl px-5 h-10 font-medium shadow-lg shadow-emerald-500/25"
                    onClick={() => navigate("/pcf-request/new")}
                  >
                    Create PCF
                  </Button>
                </div>
              </div>
            )}

            {/* Manage PCF View */}
            {pcfActiveMenu === "manage-pcf" && (
              <div className="bg-white rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <Avatar size="default" className="bg-amber-400 text-white">
                    {pcfHistoryData[0]?.request_title
                      ?.charAt(0)
                      ?.toUpperCase() || "N"}
                  </Avatar>
                  <Text strong className="text-xl">
                    Supplier PCF Data
                  </Text>
                  <div className="flex-1"></div>
                  <Text type="secondary">PCF Value: </Text>
                  <Text strong>
                    {pcfHistoryData[0]?.overall_pcf?.toFixed(2) || "0.00"}
                  </Text>
                </div>

                {/* Supplier Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-emerald-500 text-white">
                        <th className="px-4 py-3 text-left text-sm font-medium rounded-tl-lg">
                          Supplier Name
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium">
                          Location
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium">
                          Supplier ID
                        </th>
                        <th className="px-4 py-3 text-center text-sm font-medium">
                          PCF State
                        </th>
                        <th className="px-4 py-3 text-center text-sm font-medium">
                          Shared PCFs
                        </th>
                        <th className="px-4 py-3 text-center text-sm font-medium">
                          Components Supplied
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-medium rounded-tr-lg">
                          PCF Value
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        // Extract unique suppliers from all BOM lists
                        const suppliersMap = new Map();
                        pcfHistoryData.forEach((pcf) => {
                          pcf.bom_list?.forEach((bom) => {
                            if (
                              bom.supplier &&
                              !suppliersMap.has(bom.supplier.sup_id)
                            ) {
                              suppliersMap.set(bom.supplier.sup_id, {
                                ...bom.supplier,
                                pcf_state: pcf.status,
                                components_count: 1,
                                pcf_value:
                                  bom.pcf_total_emission_calculation
                                    ?.total_pcf_value || 0,
                                location: bom.production_location || "N/A",
                              });
                            } else if (bom.supplier) {
                              const existing = suppliersMap.get(
                                bom.supplier.sup_id,
                              );
                              existing.components_count += 1;
                              existing.pcf_value +=
                                bom.pcf_total_emission_calculation
                                  ?.total_pcf_value || 0;
                            }
                          });
                        });

                        const suppliers = Array.from(suppliersMap.values());

                        if (suppliers.length === 0) {
                          return (
                            <tr>
                              <td
                                colSpan={7}
                                className="px-4 py-8 text-center text-gray-500"
                              >
                                No supplier data available
                              </td>
                            </tr>
                          );
                        }

                        return suppliers.map((supplier, index) => (
                          <tr
                            key={supplier.sup_id}
                            className={`border-b border-gray-100 ${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                          >
                            <td className="px-4 py-3 text-sm">
                              {supplier.supplier_name}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {supplier.location}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {supplier.code}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Tag
                                color={
                                  supplier.pcf_state === "Approved"
                                    ? "green"
                                    : "orange"
                                }
                                className="rounded-full"
                              >
                                {supplier.pcf_state === "Approved"
                                  ? "Secondary Data"
                                  : "PCF Data Unavailable"}
                              </Tag>
                            </td>
                            <td className="px-4 py-3 text-sm text-center">2</td>
                            <td className="px-4 py-3 text-sm text-center">
                              {supplier.components_count}
                            </td>
                            <td className="px-4 py-3 text-sm text-right">
                              {supplier.pcf_value.toFixed(3)}
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Linked Secondary Data Source View */}
            {pcfActiveMenu === "linked-secondary" && (
              <div className="bg-white rounded-xl p-5 shadow-sm">
                <Text strong className="text-xl block text-center mb-6">
                  Secondary Data Entries
                </Text>

                {/* Filters */}
                <Row gutter={16} className="mb-4">
                  <Col xs={24} sm={12} md={5}>
                    <Text type="secondary" className="block text-xs mb-1">
                      PCF Request ID
                    </Text>
                    <Select
                      value={secondaryDataSelectedPcf}
                      onChange={handleSecondaryDataPcfChange}
                      className="w-full"
                      placeholder="Select PCF Request"
                      loading={secondaryDataLoading}
                    >
                      {bomPcfDropdown.map((item) => (
                        <Select.Option key={item.id} value={item.id}>
                          {item.request_title || item.code}
                        </Select.Option>
                      ))}
                    </Select>
                  </Col>
                  <Col xs={24} sm={12} md={5}>
                    <Text type="secondary" className="block text-xs mb-1">
                      Lifecycle Stage
                    </Text>
                    <Select
                      className="w-full"
                      defaultValue="all"
                      placeholder="All Lifecycle Stages"
                    >
                      <Select.Option value="all">
                        All Lifecycle Stages
                      </Select.Option>
                      <Select.Option value="production">
                        Production
                      </Select.Option>
                      <Select.Option value="distribution">
                        Distribution
                      </Select.Option>
                      <Select.Option value="use">Use Phase</Select.Option>
                      <Select.Option value="end-of-life">
                        End - of - Life
                      </Select.Option>
                    </Select>
                  </Col>
                  <Col xs={24} sm={12} md={5}>
                    <Text type="secondary" className="block text-xs mb-1">
                      Material Type
                    </Text>
                    <Select
                      className="w-full"
                      defaultValue="all"
                      placeholder="All Material Types"
                    >
                      <Select.Option value="all">
                        All Material Types
                      </Select.Option>
                      <Select.Option value="aluminum">Aluminum</Select.Option>
                      <Select.Option value="steel">Steel</Select.Option>
                      <Select.Option value="plastic">Plastic</Select.Option>
                    </Select>
                  </Col>
                  <Col xs={24} sm={12} md={5}>
                    <Text type="secondary" className="block text-xs mb-1">
                      Source
                    </Text>
                    <Select
                      className="w-full"
                      defaultValue="all"
                      placeholder="All Sources"
                    >
                      <Select.Option value="all">All Sources</Select.Option>
                      <Select.Option value="catena-x">Catena-X</Select.Option>
                      <Select.Option value="ecoinvent">Ecoinvent</Select.Option>
                      <Select.Option value="internal">
                        Internal DB
                      </Select.Option>
                    </Select>
                  </Col>
                  <Col xs={24} sm={12} md={4}>
                    <Text type="secondary" className="block text-xs mb-1">
                      Search
                    </Text>
                    <Input
                      placeholder="Search by keyword..."
                      prefix={<Search size={16} className="text-gray-400" />}
                      value={secondaryDataSearch}
                      onChange={(e) => {
                        setSecondaryDataSearch(e.target.value);
                        setSecondaryDataCurrentPage(1);
                      }}
                      allowClear
                    />
                  </Col>
                </Row>

                {/* Secondary Data Table */}
                {secondaryDataLoading ? (
                  <div className="flex justify-center py-12">
                    <Spin size="large" />
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-emerald-500 text-white">
                            <th className="px-4 py-3 text-left text-sm font-medium rounded-tl-lg">
                              Material Component
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-medium">
                              Source
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-medium">
                              Lifecycle Stage
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-medium">
                              Emission Value(Kg2Coe)
                            </th>
                            <th className="px-4 py-3 text-center text-sm font-medium rounded-tr-lg">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const bomList =
                              secondaryDataEntries?.bom_list || [];
                            const filteredList = bomList.filter(
                              (item) =>
                                item.component_name
                                  ?.toLowerCase()
                                  .includes(
                                    secondaryDataSearch.toLowerCase(),
                                  ) ||
                                item.material_number
                                  ?.toLowerCase()
                                  .includes(secondaryDataSearch.toLowerCase()),
                            );
                            const paginatedList = filteredList.slice(
                              (secondaryDataCurrentPage - 1) *
                                secondaryDataPageSize,
                              secondaryDataCurrentPage * secondaryDataPageSize,
                            );

                            if (paginatedList.length === 0) {
                              return (
                                <tr>
                                  <td
                                    colSpan={5}
                                    className="px-4 py-8 text-center text-gray-500"
                                  >
                                    {secondaryDataSelectedPcf
                                      ? "No secondary data entries found"
                                      : "Please select a PCF Request ID"}
                                  </td>
                                </tr>
                              );
                            }

                            return paginatedList.map((item, index) => (
                              <tr
                                key={item.bom_id}
                                className={`border-b border-gray-100 hover:bg-gray-50 ${
                                  index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                                }`}
                              >
                                <td className="px-4 py-3 text-sm">
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-500">⬡</span>
                                    {item.component_name || "-"}
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <Tag
                                    color={
                                      item.data_source === "Catena-X"
                                        ? "cyan"
                                        : item.data_source === "Ecoinvent"
                                          ? "green"
                                          : "orange"
                                    }
                                    className="rounded-full"
                                  >
                                    {item.data_source || "Internal DB"}
                                  </Tag>
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  {secondaryDataEntries?.life_cycle_stage_name ||
                                    "Production"}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  {item.pcf_total_emission_calculation
                                    ?.total_pcf_value
                                    ? item.pcf_total_emission_calculation.total_pcf_value.toLocaleString(
                                        'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 }
                                      )
                                    : "-"}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <Button
                                    type="text"
                                    icon={<Eye size={16} />}
                                    onClick={() =>
                                      handleViewSecondaryDataDetails(item)
                                    }
                                  />
                                </td>
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {secondaryDataEntries?.bom_list &&
                      secondaryDataEntries.bom_list.length > 0 && (
                        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                          <Text type="secondary" className="text-sm">
                            Showing{" "}
                            {Math.min(
                              (secondaryDataCurrentPage - 1) *
                                secondaryDataPageSize +
                                1,
                              (secondaryDataEntries?.bom_list || []).filter(
                                (item) =>
                                  item.component_name
                                    ?.toLowerCase()
                                    .includes(
                                      secondaryDataSearch.toLowerCase(),
                                    ) ||
                                  item.material_number
                                    ?.toLowerCase()
                                    .includes(
                                      secondaryDataSearch.toLowerCase(),
                                    ),
                              ).length,
                            )}{" "}
                            to{" "}
                            {Math.min(
                              secondaryDataCurrentPage * secondaryDataPageSize,
                              (secondaryDataEntries?.bom_list || []).filter(
                                (item) =>
                                  item.component_name
                                    ?.toLowerCase()
                                    .includes(
                                      secondaryDataSearch.toLowerCase(),
                                    ) ||
                                  item.material_number
                                    ?.toLowerCase()
                                    .includes(
                                      secondaryDataSearch.toLowerCase(),
                                    ),
                              ).length,
                            )}{" "}
                            of{" "}
                            {
                              (secondaryDataEntries?.bom_list || []).filter(
                                (item) =>
                                  item.component_name
                                    ?.toLowerCase()
                                    .includes(
                                      secondaryDataSearch.toLowerCase(),
                                    ) ||
                                  item.material_number
                                    ?.toLowerCase()
                                    .includes(
                                      secondaryDataSearch.toLowerCase(),
                                    ),
                              ).length
                            }{" "}
                            entries
                          </Text>
                          <Pagination
                            current={secondaryDataCurrentPage}
                            pageSize={secondaryDataPageSize}
                            total={
                              (secondaryDataEntries?.bom_list || []).filter(
                                (item) =>
                                  item.component_name
                                    ?.toLowerCase()
                                    .includes(
                                      secondaryDataSearch.toLowerCase(),
                                    ) ||
                                  item.material_number
                                    ?.toLowerCase()
                                    .includes(
                                      secondaryDataSearch.toLowerCase(),
                                    ),
                              ).length
                            }
                            onChange={(page) =>
                              setSecondaryDataCurrentPage(page)
                            }
                            showSizeChanger={false}
                            size="small"
                          />
                        </div>
                      )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Secondary Data Details Drawer */}
          <Drawer
            title={
              <div className="flex items-center justify-between">
                <Text strong>Secondary Data Details</Text>
              </div>
            }
            placement="right"
            onClose={() => setSecondaryDataDrawerOpen(false)}
            open={secondaryDataDrawerOpen}
            width={500}
          >
            {selectedSecondaryDataItem && (
              <div className="flex flex-col gap-4">
                {/* Header */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <span className="text-emerald-600">⬡</span>
                  </div>
                  <div>
                    <Text strong className="block">
                      {selectedSecondaryDataItem.component_name}
                    </Text>
                    <Text type="secondary" className="text-xs">
                      {selectedSecondaryDataItem.material_number}
                    </Text>
                  </div>
                </div>

                {/* Info Grid */}
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <Text type="secondary" className="block text-xs">
                        Material Type
                      </Text>
                      <Text strong>
                        {selectedSecondaryDataItem.material_emission?.[0]
                          ?.material_type || "N/A"}
                      </Text>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <Text type="secondary" className="block text-xs">
                        Lifecycle Stage
                      </Text>
                      <Text strong>
                        {secondaryDataEntries?.life_cycle_stage_name ||
                          "Production"}
                      </Text>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <Text type="secondary" className="block text-xs">
                        Emission Value
                      </Text>
                      <Text strong>
                        {selectedSecondaryDataItem
                          .pcf_total_emission_calculation?.total_pcf_value
                          ? `${selectedSecondaryDataItem.pcf_total_emission_calculation.total_pcf_value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} kgCO₂e`
                          : "N/A"}
                      </Text>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <Text type="secondary" className="block text-xs">
                        Validity Period
                      </Text>
                      <Text strong>Jan 2024 - Dec 2025</Text>
                    </div>
                  </Col>
                </Row>

                {/* Data Source */}
                <div>
                  <Text strong className="block mb-2">
                    Data Source
                  </Text>
                  <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                      <span className="text-white text-xs">E</span>
                    </div>
                    <div>
                      <Text strong className="block text-sm">
                        {selectedSecondaryDataItem.data_source || "Ecoinvent"}
                      </Text>
                      <Text type="secondary" className="text-xs">
                        Version 3.8
                      </Text>
                    </div>
                  </div>
                  <Text type="secondary" className="text-xs mt-1 block">
                    Published by Ecoinvent Association
                  </Text>
                </div>

                {/* Data Quality Scores */}
                {selectedSecondaryDataItem.dqr_rating && (
                  <div>
                    <Text strong className="block mb-2">
                      Data Quality Scores
                    </Text>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <Text className="w-28 text-sm">Transparency</Text>
                        <Progress
                          percent={90}
                          size="small"
                          className="flex-1"
                          strokeColor="#22c55e"
                          showInfo={false}
                        />
                        <Text className="text-sm">4.5/5</Text>
                      </div>
                      <div className="flex items-center gap-2">
                        <Text className="w-28 text-sm">Reliability</Text>
                        <Progress
                          percent={84}
                          size="small"
                          className="flex-1"
                          strokeColor="#3b82f6"
                          showInfo={false}
                        />
                        <Text className="text-sm">4.2/5</Text>
                      </div>
                      <div className="flex items-center gap-2">
                        <Text className="w-28 text-sm">Completeness</Text>
                        <Progress
                          percent={76}
                          size="small"
                          className="flex-1"
                          strokeColor="#f59e0b"
                          showInfo={false}
                        />
                        <Text className="text-sm">3.8/5</Text>
                      </div>
                    </div>
                  </div>
                )}

                {/* Emission Breakdown */}
                <div>
                  <Text strong className="block mb-2">
                    Emission Breakdown
                  </Text>
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between">
                      <Text type="secondary" className="text-sm">
                        Raw Material Extraction
                      </Text>
                      <Text className="text-sm">
                        {selectedSecondaryDataItem
                          .pcf_total_emission_calculation?.material_value
                          ? `${selectedSecondaryDataItem.pcf_total_emission_calculation.material_value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} kgCO₂e`
                          : "-"}
                      </Text>
                    </div>
                    <div className="flex justify-between">
                      <Text type="secondary" className="text-sm">
                        Processing
                      </Text>
                      <Text className="text-sm">
                        {selectedSecondaryDataItem
                          .pcf_total_emission_calculation?.production_value
                          ? `${selectedSecondaryDataItem.pcf_total_emission_calculation.production_value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} kgCO₂e`
                          : "-"}
                      </Text>
                    </div>
                    <div className="flex justify-between">
                      <Text type="secondary" className="text-sm">
                        Transportation
                      </Text>
                      <Text className="text-sm">
                        {selectedSecondaryDataItem
                          .pcf_total_emission_calculation?.logistic_value
                          ? `${selectedSecondaryDataItem.pcf_total_emission_calculation.logistic_value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} kgCO₂e`
                          : "-"}
                      </Text>
                    </div>
                  </div>
                </div>

                {/* Usage Recommendation */}
                <div>
                  <Text strong className="block mb-2">
                    Usage Recommendation
                  </Text>
                  <Text type="secondary" className="text-sm">
                    Recommended for use with automotive body panels and
                    structural components when primary data is unavailable.
                    Verified by third-party assessment.
                  </Text>
                </div>

                {/* License & Usage Note */}
                <div>
                  <Text strong className="block mb-2">
                    License & Usage Note
                  </Text>
                  <Text type="secondary" className="text-sm">
                    Licensed for commercial use under Ecoinvent terms.
                    Attribution required when publishing results. Data should be
                    updated when primary sources become available.
                  </Text>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-4">
                  <Button
                    icon={<Download size={16} />}
                    className="flex-1 rounded-xl"
                    onClick={() => {
                      const data = {
                        component_name:
                          selectedSecondaryDataItem.component_name,
                        material_number:
                          selectedSecondaryDataItem.material_number,
                        data_source:
                          selectedSecondaryDataItem.data_source || "Ecoinvent",
                        total_pcf_value:
                          selectedSecondaryDataItem
                            .pcf_total_emission_calculation?.total_pcf_value,
                        material_value:
                          selectedSecondaryDataItem
                            .pcf_total_emission_calculation?.material_value,
                        production_value:
                          selectedSecondaryDataItem
                            .pcf_total_emission_calculation?.production_value,
                        logistic_value:
                          selectedSecondaryDataItem
                            .pcf_total_emission_calculation?.logistic_value,
                        dqr_rating: selectedSecondaryDataItem.dqr_rating,
                      };
                      const blob = new Blob([JSON.stringify(data, null, 2)], {
                        type: "application/json",
                      });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `${selectedSecondaryDataItem.component_name || "secondary-data"}-emission-data.json`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                      message.success("Data downloaded successfully");
                    }}
                  >
                    Download
                  </Button>
                </div>
              </div>
            )}
          </Drawer>
        </div>
      ),
    },
  ];

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {/* Hero Header Section */}
      <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 pt-6 pb-8 px-6 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full translate-y-1/2 -translate-x-1/2"></div>
        </div>

        <div className="relative z-10 mx-auto">
          {/* Breadcrumb */}
          <button
            onClick={() => navigate("/product-portfolio/all-products")}
            className="flex items-center gap-2 text-white/90 hover:text-white hover:bg-white/10 px-3 py-1.5 -ml-3 rounded-lg mb-4 transition-all cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span className="text-sm font-medium">
              Back to Product Portfolio
            </span>
          </button>

          {/* Product Header */}
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg border border-white/30">
                <Package className="w-8 h-8 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-white">
                    {product.product_name}
                  </h1>
                  <Tag className="bg-white/20 text-white border-0 rounded-full px-3 py-0.5 backdrop-blur-sm">
                    {product.product_code}
                  </Tag>
                </div>
                <div className="flex items-center gap-4 text-white/80 text-sm">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-emerald-300 rounded-full"></span>
                    {product.category_name || "General Category"}
                  </span>
                  <span>•</span>
                  <span>{product.sub_category_name || "Sub Category"}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              {canUpdate("Product Portfolio") && (
                <button
                  onClick={() =>
                    navigate(`/product-portfolio/edit/${product.id}`)
                  }
                  className="flex items-center gap-2 bg-white text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 rounded-xl px-5 h-11 font-medium shadow-lg transition-all"
                >
                  <Edit size={16} />
                  Edit Product
                </button>
              )}
              {canDelete("Product Portfolio") && (
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 bg-white/15 border border-white/30 text-white hover:bg-red-500 hover:border-red-500 rounded-xl px-5 h-11 font-medium transition-all"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              )}
            </div>
          </div>

          {/* Quick Stats Bar */}
          <div className="flex items-center gap-8 mt-6 pt-5 border-t border-white/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <div className="text-white">
                <div className="text-xs text-white/70 font-medium">
                  Est. PCF
                </div>
                <div className="font-bold text-lg">
                  {product.ed_estimated_pcf
                    ? `${product.ed_estimated_pcf} kg`
                    : "N/A"}
                </div>
              </div>
            </div>
            <div className="w-px h-10 bg-white/30"></div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Puzzle className="w-5 h-5 text-white" />
              </div>
              <div className="text-white">
                <div className="text-xs text-white/70 font-medium">
                  Components
                </div>
                <div className="font-bold text-lg">
                  {totalComponentsLinked || 0}
                </div>
              </div>
            </div>
            <div className="w-px h-10 bg-white/30"></div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Link2 className="w-5 h-5 text-white" />
              </div>
              <div className="text-white">
                <div className="text-xs text-white/70 font-medium">
                  Linked PCFs
                </div>
                <div className="font-bold text-lg">{linkedPCFs.length}</div>
              </div>
            </div>
            {/* <div className="w-px h-10 bg-white/30"></div>
            <div className="flex items-center gap-3">
              <Tag
                color={
                  product.pcf_status === "Available"
                    ? "green"
                    : product.pcf_status === "In Progress"
                    ? "blue"
                    : "default"
                }
                className="rounded-full px-4 py-1 text-sm font-semibold"
              >
                {product.pcf_status || "Not Available"}
              </Tag>
            </div> */}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="px-6 -mt-4 relative z-20">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Tabs and Content */}
          <Tabs
            defaultActiveKey="1"
            items={items}
            className="product-view-tabs"
            tabBarStyle={{
              marginBottom: 0,
              paddingLeft: 24,
              paddingRight: 24,
              paddingTop: 16,
              background: "#fff",
              borderBottom: "1px solid #e5e7eb",
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ProductView;
