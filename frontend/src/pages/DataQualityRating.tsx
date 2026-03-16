import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  CheckCircle,
  AlertCircle,
  Info,
  Save,
  X,
  Settings,
  Clock,
  Globe,
  Database,
  Target,
  Loader,
  ArrowLeft,
  Star,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import supplierQuestionnaireService from "../lib/supplierQuestionnaireService";
import authService from "../lib/authService";
import { usePermissions } from "../contexts/PermissionContext";
import { DQR_CONFIG } from "../config/questionnaireConfig";
import {
  DQR_QUESTIONS_CONFIG,
  DQR_CATEGORIES,
  parseDataField,
  formatDataPointDisplay,
  type DQRQuestionConfig,
} from "../config/dqrQuestionsConfig";

// API response data point structure
// Note: Different question types have different ID fields
interface DQRDataPointAPI {
  sgiq_id: string;
  data: string; // JSON string
  // Various ID fields depending on question type
  edrqn_id?: string;
  spqrqe_id?: string;  // q11
  spqrqt_id?: string;  // q12
  psdrqt_id?: string;  // q13
  pcmrqf_id?: string;  // q15
  scoserqs_id?: string; // q16
  mccoqrqs_id?: string; // q17
  stidefpeqtt_id?: string; // q22
  stieqts_id?: string; // q26
  stideqto_id?: string; // q31
  stideqfo_id?: string; // q41
  rmuicmqft_id?: string; // q52
  stoieqft_id?: string; // q53
  stoieqff_id?: string; // q54
  woppupqso_id?: string; // q61
  stoieqsf_id?: string; // q64
  stoieqsn_id?: string; // q69, q79
  dpctqsf_id?: string; // q75
  stoieqe_id?: string; // q80
  // DQR tag fields
  ter_tag_type?: string | null;
  ter_tag_value?: string | null;
  ter_data_point?: string | null;
  tir_tag_type?: string | null;
  tir_tag_value?: string | null;
  tir_data_point?: string | null;
  gr_tag_type?: string | null;
  gr_tag_value?: string | null;
  gr_data_point?: string | null;
  c_tag_type?: string | null;
  c_tag_value?: string | null;
  c_data_point?: string | null;
  pds_tag_type?: string | null;
  pds_tag_value?: string | null;
  pds_data_point?: string | null;
  [key: string]: any; // Allow other dynamic ID fields
}

// Extract all ID fields from API response item (different questions use different ID field names)
const extractAllIds = (item: DQRDataPointAPI): Record<string, string> => {
  const ids: Record<string, string> = {};

  // Extract all fields ending with '_id'
  for (const key of Object.keys(item)) {
    if (key.endsWith('_id') && item[key]) {
      ids[key] = item[key];
    }
  }

  return ids;
};

// Get a unique identifier for the record (for UI key purposes)
const getRecordUniqueId = (ids: Record<string, string>): string => {
  // Return the first non-sgiq_id value as unique identifier
  for (const [key, value] of Object.entries(ids)) {
    if (key !== 'sgiq_id' && value) {
      return value;
    }
  }
  return '';
};

// UI data point structure
interface DataPoint {
  id: string; // Unique composite key: questionKey_recordId
  originalIds: Record<string, string>; // All original ID fields from API (to send back in update)
  questionKey: string; // q9, q16, etc.
  displayName: string;
  rawData: Record<string, any>;
  category: string;
  dqiRequired: string[];
  // DQR values from API
  ter_tag_type?: string | null;
  ter_tag_value?: string | null;
  tir_tag_type?: string | null;
  tir_tag_value?: string | null;
  gr_tag_type?: string | null;
  gr_tag_value?: string | null;
  c_tag_type?: string | null;
  pds_tag_type?: string | null;
}

// DQI state for a data point
interface DQIState {
  TeR?: { level1?: string; level2?: string };
  TiR?: { level1?: string; level2?: string };
  GR?: { level1?: string; level2?: string };
  C?: { classification?: string };
  PDS?: { type?: string };
}

const DataQualityRating = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { canUpdate } = usePermissions();
  const sgiq_id = searchParams.get("sgiq_id");
  const bom_pcf_id_from_url = searchParams.get("bom_pcf_id");

  const [selectedDataPoint, setSelectedDataPoint] = useState<DataPoint | null>(null);
  const [dqiData, setDqiData] = useState<Record<string, DQIState>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [supplierData, setSupplierData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [modifiedQuestions, setModifiedQuestions] = useState<Set<string>>(new Set());

  // Load DQR data on mount
  useEffect(() => {
    const fetchDQRData = async () => {
      if (!sgiq_id) {
        setError("No supplier questionnaire ID provided");
        setIsLoading(false);
        return;
      }

      if (!authService.isAuthenticated()) {
        setError("User not authenticated");
        setIsLoading(false);
        return;
      }

      try {
        const result = await supplierQuestionnaireService.getDQRDetailsById(sgiq_id);

        if (result.success && result.data) {
          setSupplierData(result.data);
          const points = processAPIResponse(result.data);
          setDataPoints(points);
          populateExistingDQRData(points);

          // Expand first category by default
          if (points.length > 0) {
            const firstCategory = points[0].category;
            setExpandedCategories({ [firstCategory]: true });
          }
        } else {
          setError(result.message || "Failed to load DQR data");
        }
      } catch (err) {
        console.error("Error fetching DQR data:", err);
        setError("An error occurred while loading DQR data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDQRData();
  }, [sgiq_id]);

  // Process API response into DataPoint array
  const processAPIResponse = (data: any): DataPoint[] => {
    const points: DataPoint[] = [];

    // Iterate through all question keys in the response
    Object.entries(data).forEach(([key, value]) => {
      // Skip non-question keys
      if (!key.startsWith('q') || !Array.isArray(value)) return;

      const questionConfig = DQR_QUESTIONS_CONFIG[key];
      if (!questionConfig) return;

      // Process each data point for this question
      (value as DQRDataPointAPI[]).forEach((item, index) => {
        const parsedData = parseDataField(item.data);
        const displayName = formatDataPointDisplay(parsedData);
        // Extract all ID fields from the record
        const allIds = extractAllIds(item);
        const recordUniqueId = getRecordUniqueId(allIds);
        // Create unique composite key using questionKey and recordId (or index as fallback)
        const uniqueId = `${key}_${recordUniqueId || index}`;

        points.push({
          id: uniqueId,
          originalIds: allIds,
          questionKey: key,
          displayName: displayName || `${questionConfig.label} - ${(recordUniqueId || String(index)).slice(0, 8)}`,
          rawData: parsedData,
          category: questionConfig.category,
          dqiRequired: questionConfig.dqiRequired,
          ter_tag_type: item.ter_tag_type,
          ter_tag_value: item.ter_tag_value,
          tir_tag_type: item.tir_tag_type,
          tir_tag_value: item.tir_tag_value,
          gr_tag_type: item.gr_tag_type,
          gr_tag_value: item.gr_tag_value,
          c_tag_type: item.c_tag_type,
          pds_tag_type: item.pds_tag_type,
        });
      });
    });

    return points;
  };

  // Populate existing DQR data into state
  const populateExistingDQRData = (points: DataPoint[]) => {
    const populatedData: Record<string, DQIState> = {};

    points.forEach((point) => {
      const dqi: DQIState = {};

      // Map TeR
      if (point.ter_tag_type || point.ter_tag_value) {
        dqi.TeR = {
          level1: point.ter_tag_type || undefined,
          level2: point.ter_tag_value || undefined,
        };
      }

      // Map TiR
      if (point.tir_tag_type || point.tir_tag_value) {
        dqi.TiR = {
          level1: point.tir_tag_type || undefined,
          level2: point.tir_tag_value || undefined,
        };
      }

      // Map GR
      if (point.gr_tag_type || point.gr_tag_value) {
        dqi.GR = {
          level1: point.gr_tag_type || undefined,
          level2: point.gr_tag_value || undefined,
        };
      }

      // Map C
      if (point.c_tag_type) {
        dqi.C = { classification: point.c_tag_type };
      }

      // Map PDS
      if (point.pds_tag_type) {
        dqi.PDS = { type: point.pds_tag_type };
      }

      if (Object.keys(dqi).length > 0) {
        populatedData[point.id] = dqi;
      }
    });

    setDqiData(populatedData);
  };

  const handleDQIChange = (
    dataPointId: string,
    questionKey: string,
    dqiType: string,
    level: string,
    value: string
  ) => {
    setDqiData((prev) => ({
      ...prev,
      [dataPointId]: {
        ...prev[dataPointId],
        [dqiType]: {
          ...prev[dataPointId]?.[dqiType as keyof DQIState],
          [level]: value,
        },
      },
    }));

    // Track modified questions for save
    setModifiedQuestions((prev) => new Set(prev).add(questionKey));
  };

  // Transform UI data to API format and save
  const handleSave = async () => {
    if (!sgiq_id) {
      alert("No questionnaire ID");
      return;
    }

    try {
      setIsSaving(true);

      // Group data points by question key
      const groupedByQuestion: Record<string, DataPoint[]> = {};
      dataPoints.forEach((point) => {
        if (!groupedByQuestion[point.questionKey]) {
          groupedByQuestion[point.questionKey] = [];
        }
        groupedByQuestion[point.questionKey].push(point);
      });

      // Only save questions that have been modified
      const questionsToSave = modifiedQuestions.size > 0
        ? Array.from(modifiedQuestions)
        : Object.keys(groupedByQuestion);

      if (questionsToSave.length === 0) {
        alert("No DQR ratings to save.");
        return;
      }

      // Save each question type
      const savePromises = questionsToSave.map(async (questionKey) => {
        const points = groupedByQuestion[questionKey];
        if (!points || points.length === 0) return { success: true, message: '' };

        const records = points.map((point) => {
          const pointData = dqiData[point.id] || {};

          return {
            // Spread all original IDs from the API response
            ...point.originalIds,
            // DQR tag fields
            ter_tag_type: pointData.TeR?.level1 || null,
            ter_tag_value: pointData.TeR?.level2 || null,
            ter_data_point: pointData.TeR?.level2
              ? String(getDQRValue("TeR", pointData.TeR.level2))
              : null,
            tir_tag_type: pointData.TiR?.level1 || null,
            tir_tag_value: pointData.TiR?.level2 || null,
            tir_data_point: pointData.TiR?.level2
              ? String(getDQRValue("TiR", pointData.TiR.level2))
              : null,
            gr_tag_type: pointData.GR?.level1 || null,
            gr_tag_value: pointData.GR?.level2 || null,
            gr_data_point: pointData.GR?.level2
              ? String(getDQRValue("GR", pointData.GR.level2))
              : null,
            c_tag_type: pointData.C?.classification || null,
            c_tag_value: null,
            c_data_point: null,
            pds_tag_type: pointData.PDS?.type || null,
            pds_tag_value: null,
            pds_data_point: null,
          };
        });

        return supplierQuestionnaireService.updateDQRRating(questionKey, records);
      });

      const results = await Promise.all(savePromises);
      const allSuccess = results.every((result) => result.success);

      if (allSuccess) {
        alert("DQR ratings saved successfully!");
        setModifiedQuestions(new Set());
      } else {
        const errorMessages = results
          .filter((r) => !r.success)
          .map((r) => r.message)
          .join(", ");
        alert(`Some ratings failed to save: ${errorMessages}`);
      }
    } catch (error: any) {
      console.error("Error saving DQR ratings:", error);
      alert(error.message || "Failed to save DQR ratings");
    } finally {
      setIsSaving(false);
    }
  };

  const getDQRValue = (dqiType: string, level2Value: string): number | string => {
    const dqrMappings: Record<string, Record<string, number | string>> = {
      TeR: {
        "Site specific technology": 1,
        "Similar process technology": 2,
        "Industry average technology": 3,
        "Proxy process": 4,
        Mismatch: 5,
      },
      TiR: {
        "Data Period < 1 Year": 1,
        "1Y < Data Period < 3Y": 2,
        "3Y < Data Period < 5Y": 3,
        "5Y < Data Period < 10Y": 4,
        "Data Period > 10 Year": 5,
      },
      GR: {
        "Site Specific": 1,
        "Country Specific": 2,
        Regional: 3,
        Global: 4,
        Mismatch: 5,
      },
      PDS: {
        Primary: "Primary",
        Secondary: "Secondary",
        Proxy: "Proxy",
      },
    };

    const mapping = dqrMappings[dqiType];
    if (!mapping) return "-";

    const value = mapping[level2Value];
    return value !== undefined ? value : "-";
  };

  const getDQRColor = (dqr: number | string) => {
    const numericValue = typeof dqr === "number" ? dqr : parseInt(String(dqr));
    if (numericValue === 1) return "text-green-600 bg-green-50 border-green-200";
    if (numericValue === 2) return "text-green-600 bg-green-50 border-green-200";
    if (numericValue === 3) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    if (numericValue === 4) return "text-orange-600 bg-orange-50 border-orange-200";
    if (numericValue === 5) return "text-red-600 bg-red-50 border-red-200";
    return "text-gray-600 bg-gray-50 border-gray-200";
  };

  // Group data points by category
  const getGroupedDataPoints = (): Record<string, DataPoint[]> => {
    const grouped: Record<string, DataPoint[]> = {};

    dataPoints.forEach((point) => {
      if (!grouped[point.category]) {
        grouped[point.category] = [];
      }
      grouped[point.category].push(point);
    });

    return grouped;
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const getCompletionStats = (points: DataPoint[]) => {
    let completed = 0;
    let total = 0;

    points.forEach((point) => {
      const pointData = dqiData[point.id] || {};
      const requiredDQIs = point.dqiRequired.length;
      const completedDQIs = Object.keys(pointData).length;
      total += requiredDQIs;
      completed += completedDQIs;
    });

    return { completed, total, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
  };

  const DataPointCard = ({ dataPoint, index, showQuestionLabel = false }: { dataPoint: DataPoint; index: number; showQuestionLabel?: boolean }) => {
    const isSelected = selectedDataPoint?.id === dataPoint.id;
    const pointData = dqiData[dataPoint.id] || {};
    const completedDQIs = Object.keys(pointData).length;
    const totalDQIs = dataPoint.dqiRequired.length;
    const isCompleted = completedDQIs === totalDQIs;
    const questionConfig = DQR_QUESTIONS_CONFIG[dataPoint.questionKey];

    // For single items (showQuestionLabel=true), show question label as title
    // For grouped items, show data preview or Item #
    const hasDataPreview = dataPoint.displayName && dataPoint.displayName.trim();
    const title = showQuestionLabel
      ? (questionConfig?.label || dataPoint.questionKey)
      : (hasDataPreview ? dataPoint.displayName : `Item ${index + 1}`);
    const subtitle = showQuestionLabel && hasDataPreview ? dataPoint.displayName : null;

    return (
      <div
        onClick={() => setSelectedDataPoint(dataPoint)}
        className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
          isSelected
            ? "border-green-500 bg-green-50 shadow-lg"
            : isCompleted
            ? "border-green-300 bg-green-50 hover:bg-green-100 hover:shadow-md"
            : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
        }`}
      >
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <h4 className={`font-medium text-sm ${isCompleted ? "text-green-900" : "text-gray-900"}`}>
              {title}
            </h4>
            {subtitle && (
              <p className={`text-xs mt-0.5 ${isCompleted ? "text-green-700" : "text-gray-500"}`}>
                {subtitle}
              </p>
            )}
          </div>
          {isCompleted ? (
            <CheckCircle className="text-green-600 flex-shrink-0" size={18} />
          ) : (
            <AlertCircle className="text-orange-500 flex-shrink-0" size={18} />
          )}
        </div>
        <div className="flex justify-between items-center text-xs mt-2">
          <span className={isCompleted ? "text-green-700 font-medium" : "text-gray-500"}>
            {completedDQIs}/{totalDQIs} DQIs
          </span>
          <span className={`px-2 py-0.5 rounded-full text-xs ${
            isCompleted
              ? "bg-green-100 text-green-700"
              : "bg-orange-100 text-orange-700"
          }`}>
            {isCompleted ? "Done" : "Pending"}
          </span>
        </div>
      </div>
    );
  };

  const DQIAssessmentPanel = ({ dataPoint }: { dataPoint: DataPoint | null }) => {
    if (!dataPoint) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <Info size={48} className="mx-auto mb-4 text-gray-400" />
            <p>Select a data point to begin assessment</p>
          </div>
        </div>
      );
    }

    const questionConfig = DQR_QUESTIONS_CONFIG[dataPoint.questionKey];
    const mainTitle = questionConfig?.label || dataPoint.questionKey;
    const hasDataPreview = dataPoint.displayName && dataPoint.displayName.trim();

    // Format raw data for display
    const formatRawDataPreview = () => {
      const entries = Object.entries(dataPoint.rawData).filter(([key, val]) =>
        val !== null && val !== undefined && val !== '' && !key.includes('id')
      );
      if (entries.length === 0) return null;
      return entries.slice(0, 4);
    };

    const rawDataEntries = formatRawDataPreview();

    return (
      <div className="space-y-5">
        <div className="bg-gradient-to-br from-green-600 via-green-500 to-emerald-600 text-white p-6 rounded-b-xl -mx-6 -mt-6 mb-6 shadow-lg sticky top-0 z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-2">{mainTitle}</h3>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                {hasDataPreview && (
                  <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full font-medium">
                    {dataPoint.displayName}
                  </span>
                )}
                <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full font-medium">
                  {dataPoint.category}
                </span>
              </div>
            </div>
            <button
              onClick={() => setSelectedDataPoint(null)}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-all hover:scale-110"
            >
              <X size={24} />
            </button>
          </div>

          {/* Show raw data summary */}
          {rawDataEntries && rawDataEntries.length > 0 && (
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20 text-sm">
              <div className="text-xs opacity-90 mb-1">Data Details</div>
              <div className="space-y-1 text-sm">
                {rawDataEntries.map(([key, val]) => (
                  <div key={key}>
                    <span className="opacity-75">{key.replace(/_/g, ' ')}:</span>{' '}
                    <span className="font-medium">{String(val)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Technological Representativeness (TeR) */}
        {dataPoint.dqiRequired.includes("TeR") && (
          <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow mt-12">
            <h4 className="text-lg font-semibold text-gray-900 mb-5 flex items-center">
              <span className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg flex items-center justify-center mr-2 shadow-lg">
                <Settings size={18} />
              </span>
              <div>
                <div className="font-bold">Technological Representativeness</div>
                <div className="text-xs text-gray-500 font-normal">TeR</div>
              </div>
            </h4>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                  Level-1 Classification <span className="text-red-500">*</span>
                </label>
                <select
                  value={dqiData[dataPoint.id]?.TeR?.level1 || ""}
                  onChange={(e) =>
                    handleDQIChange(dataPoint.id, dataPoint.questionKey, "TeR", "level1", e.target.value)
                  }
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-700 font-medium"
                >
                  <option value="">Select classification</option>
                  <option value="Applicable">Applicable</option>
                  <option value="Derived">Derived</option>
                  <option value="Not Applicable">Not Applicable</option>
                </select>
              </div>

              {dqiData[dataPoint.id]?.TeR?.level1 === "Applicable" && (
                <div className="animate-in slide-in-from-top-3 duration-300">
                  <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                    Level-2 Classification <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={dqiData[dataPoint.id]?.TeR?.level2 || ""}
                    onChange={(e) =>
                      handleDQIChange(dataPoint.id, dataPoint.questionKey, "TeR", "level2", e.target.value)
                    }
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-700 font-medium"
                  >
                    <option value="">Select technology type</option>
                    {DQR_CONFIG.TER_LEVEL2_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>

                  {dqiData[dataPoint.id]?.TeR?.level2 && (
                    <div
                      className={`mt-4 p-4 rounded-xl border-2 font-bold text-center shadow-sm ${getDQRColor(
                        getDQRValue("TeR", dqiData[dataPoint.id]?.TeR?.level2 || "")
                      )}`}
                    >
                      <div className="text-sm text-gray-600 mb-1">DQR Rating</div>
                      <div className="text-2xl">
                        {getDQRValue("TeR", dqiData[dataPoint.id]?.TeR?.level2 || "")}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Temporal Representativeness (TiR) */}
        {dataPoint.dqiRequired.includes("TiR") && (
          <div className="bg-gradient-to-br from-white to-green-50 border-2 border-green-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <h4 className="text-lg font-semibold text-gray-900 mb-5 flex items-center">
              <span className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg flex items-center justify-center mr-2 shadow-lg">
                <Clock size={18} />
              </span>
              <div>
                <div className="font-bold">Temporal Representativeness</div>
                <div className="text-xs text-gray-500 font-normal">TiR</div>
              </div>
            </h4>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                  Level-1 Classification <span className="text-red-500">*</span>
                </label>
                <select
                  value={dqiData[dataPoint.id]?.TiR?.level1 || ""}
                  onChange={(e) =>
                    handleDQIChange(dataPoint.id, dataPoint.questionKey, "TiR", "level1", e.target.value)
                  }
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-gray-700 font-medium"
                >
                  <option value="">Select classification</option>
                  {DQR_CONFIG.TIR_LEVEL1_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              {dqiData[dataPoint.id]?.TiR?.level1 === "Applicable" && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                    Level-2 Classification <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={dqiData[dataPoint.id]?.TiR?.level2 || ""}
                    onChange={(e) =>
                      handleDQIChange(dataPoint.id, dataPoint.questionKey, "TiR", "level2", e.target.value)
                    }
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-gray-700 font-medium"
                  >
                    <option value="">Select data period</option>
                    {DQR_CONFIG.TIR_LEVEL2_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>

                  {dqiData[dataPoint.id]?.TiR?.level2 && (
                    <div
                      className={`mt-4 p-4 rounded-xl border-2 font-bold text-center shadow-sm ${getDQRColor(
                        getDQRValue("TiR", dqiData[dataPoint.id]?.TiR?.level2 || "")
                      )}`}
                    >
                      <div className="text-sm text-gray-600 mb-1">DQR Rating</div>
                      <div className="text-2xl">
                        {getDQRValue("TiR", dqiData[dataPoint.id]?.TiR?.level2 || "")}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Geographical Representativeness (GR) */}
        {dataPoint.dqiRequired.includes("GR") && (
          <div className="bg-gradient-to-br from-white to-green-50 border-2 border-green-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <h4 className="text-lg font-semibold text-gray-900 mb-5 flex items-center">
              <span className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg flex items-center justify-center mr-2 shadow-lg">
                <Globe size={18} />
              </span>
              <div>
                <div className="font-bold">Geographical Representativeness</div>
                <div className="text-xs text-gray-500 font-normal">GR</div>
              </div>
            </h4>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                  Level-1 Classification <span className="text-red-500">*</span>
                </label>
                <select
                  value={dqiData[dataPoint.id]?.GR?.level1 || ""}
                  onChange={(e) =>
                    handleDQIChange(dataPoint.id, dataPoint.questionKey, "GR", "level1", e.target.value)
                  }
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-gray-700 font-medium"
                >
                  <option value="">Select classification</option>
                  <option value="Applicable">Applicable</option>
                  <option value="Derived">Derived</option>
                  <option value="Not Applicable">Not Applicable</option>
                </select>
              </div>

              {dqiData[dataPoint.id]?.GR?.level1 === "Applicable" && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                    Level-2 Classification <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={dqiData[dataPoint.id]?.GR?.level2 || ""}
                    onChange={(e) =>
                      handleDQIChange(dataPoint.id, dataPoint.questionKey, "GR", "level2", e.target.value)
                    }
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-gray-700 font-medium"
                  >
                    <option value="">Select geographical scope</option>
                    {DQR_CONFIG.GR_LEVEL2_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>

                  {dqiData[dataPoint.id]?.GR?.level2 && (
                    <div
                      className={`mt-4 p-4 rounded-xl border-2 font-bold text-center shadow-sm ${getDQRColor(
                        getDQRValue("GR", dqiData[dataPoint.id]?.GR?.level2 || "")
                      )}`}
                    >
                      <div className="text-sm text-gray-600 mb-1">DQR Rating</div>
                      <div className="text-2xl">
                        {getDQRValue("GR", dqiData[dataPoint.id]?.GR?.level2 || "")}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Primary Data Share (PDS) */}
        {dataPoint.dqiRequired.includes("PDS") && (
          <div className="bg-gradient-to-br from-white to-orange-50 border-2 border-orange-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <h4 className="text-lg font-semibold text-gray-900 mb-5 flex items-center">
              <span className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg flex items-center justify-center mr-2 shadow-lg">
                <Database size={18} />
              </span>
              <div>
                <div className="font-bold">Primary Data Share</div>
                <div className="text-xs text-gray-500 font-normal">PDS</div>
              </div>
            </h4>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                Data Source Type <span className="text-red-500">*</span>
              </label>
              <select
                value={dqiData[dataPoint.id]?.PDS?.type || ""}
                onChange={(e) =>
                  handleDQIChange(dataPoint.id, dataPoint.questionKey, "PDS", "type", e.target.value)
                }
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-gray-700 font-medium"
              >
                <option value="">Select data source</option>
                {DQR_CONFIG.PDS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                    {option === "Primary" && " (Direct measurement/supplier data)"}
                    {option === "Secondary" && " (Database/literature)"}
                    {option === "Proxy" && " (Estimated/representative data)"}
                  </option>
                ))}
              </select>

              {dqiData[dataPoint.id]?.PDS?.type && (
                <div
                  className={`mt-4 p-4 rounded-xl border-2 font-semibold text-center shadow-sm ${
                    dqiData[dataPoint.id]?.PDS?.type === "Primary"
                      ? "bg-green-50 border-green-300 text-green-700"
                      : dqiData[dataPoint.id]?.PDS?.type === "Secondary"
                      ? "bg-green-50 border-green-300 text-green-700"
                      : "bg-gray-50 border-gray-300 text-gray-700"
                  }`}
                >
                  <div className="text-sm opacity-80 mb-1">Data Source</div>
                  <div className="text-lg">{dqiData[dataPoint.id]?.PDS?.type}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Completeness (C) */}
        {dataPoint.dqiRequired.includes("C") && (
          <div className="bg-gradient-to-br from-white to-emerald-50 border-2 border-emerald-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <h4 className="text-lg font-semibold text-gray-900 mb-5 flex items-center">
              <span className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-lg flex items-center justify-center mr-2 shadow-lg">
                <Target size={18} />
              </span>
              <div>
                <div className="font-bold">Completeness</div>
                <div className="text-xs text-gray-500 font-normal">C</div>
              </div>
            </h4>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                Data Point Classification <span className="text-red-500">*</span>
              </label>
              <select
                value={dqiData[dataPoint.id]?.C?.classification || ""}
                onChange={(e) =>
                  handleDQIChange(dataPoint.id, dataPoint.questionKey, "C", "classification", e.target.value)
                }
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-gray-700 font-medium"
              >
                <option value="">Select classification</option>
                {DQR_CONFIG.C_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>

              {dqiData[dataPoint.id]?.C?.classification === "Required" && (
                <div className="mt-4 p-4 rounded-xl border-2 bg-green-50 border-green-300 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Target size={20} className="text-green-600" />
                    <span className="font-semibold text-green-800">
                      This data point is Required for PCF calculation
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <Loader size={48} className="animate-spin text-green-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading DQR data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate("/data-quality-rating")}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:shadow-lg font-medium transition-all"
          >
            Go Back to DQR List
          </button>
        </div>
      </div>
    );
  }

  const groupedDataPoints = getGroupedDataPoints();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 p-6">
      <div className="">
        {/* Header with back button */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-xl transition-colors"
            >
              <ArrowLeft size={20} />
              <span>Back</span>
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
              <span className="text-sm font-medium text-gray-600">
                ID: {sgiq_id?.slice(0, 12)}...
              </span>
            </div>
          </div>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Data Quality Assessment</h1>
                <p className="text-gray-500">
                  Evaluate data quality indicators for Product Carbon Footprint calculation
                </p>
              </div>
            </div>
            {canUpdate("Data Quality Rating") && (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 hover:shadow-lg shadow-lg shadow-green-600/20 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader className="animate-spin" size={18} />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    <span>Save Progress</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Main Content - Data Points by Category */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Data Points ({dataPoints.length} total)
          </h2>

          {Object.keys(groupedDataPoints).length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Info size={48} className="mx-auto mb-4 opacity-50" />
              <p>No data points found for this questionnaire.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedDataPoints).map(([category, points]) => {
                const stats = getCompletionStats(points);
                const isExpanded = expandedCategories[category];

                return (
                  <div key={category} className="border border-gray-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggleCategory(category)}
                      className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown size={20} className="text-gray-500" />
                        ) : (
                          <ChevronRight size={20} className="text-gray-500" />
                        )}
                        <span className="font-semibold text-gray-900">{category}</span>
                        <span className="text-sm text-gray-500">({points.length} items)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 transition-all"
                            style={{ width: `${stats.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-600">{stats.percentage}%</span>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="p-4 space-y-4">
                        {/* Group points by question within category */}
                        {(() => {
                          const groupedByQuestion: Record<string, DataPoint[]> = {};
                          points.forEach((point) => {
                            if (!groupedByQuestion[point.questionKey]) {
                              groupedByQuestion[point.questionKey] = [];
                            }
                            groupedByQuestion[point.questionKey].push(point);
                          });

                          // Separate single items and grouped items
                          const singleItems: DataPoint[] = [];
                          const groupedItems: [string, DataPoint[]][] = [];

                          Object.entries(groupedByQuestion).forEach(([questionKey, questionPoints]) => {
                            if (questionPoints.length === 1) {
                              singleItems.push(questionPoints[0]);
                            } else {
                              groupedItems.push([questionKey, questionPoints]);
                            }
                          });

                          return (
                            <>
                              {/* Single items in a simple grid */}
                              {singleItems.length > 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {singleItems.map((point, index) => (
                                    <DataPointCard key={point.id} dataPoint={point} index={index} showQuestionLabel />
                                  ))}
                                </div>
                              )}

                              {/* Grouped items with question header */}
                              {groupedItems.map(([questionKey, questionPoints]) => {
                                const questionConfig = DQR_QUESTIONS_CONFIG[questionKey];
                                const questionLabel = questionConfig?.label || questionKey;

                                return (
                                  <div key={questionKey} className="bg-gray-50 rounded-lg p-4">
                                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                      {questionLabel}
                                      <span className="text-xs font-normal text-gray-500">
                                        ({questionPoints.length} items)
                                      </span>
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                      {questionPoints.map((point, index) => (
                                        <DataPointCard key={point.id} dataPoint={point} index={index} />
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side Panel - DQI Assessment */}
        <div
          className={`fixed top-0 right-0 h-full w-full md:w-[35%] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
            selectedDataPoint ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto p-6 pt-0">
              <DQIAssessmentPanel dataPoint={selectedDataPoint} />
            </div>
          </div>
        </div>

        {/* Overlay */}
        {selectedDataPoint && (
          <div
            className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
            onClick={() => setSelectedDataPoint(null)}
          />
        )}

        {/* DQI Legend */}
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Data Quality Rating (DQR) Scale
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-2xl font-bold text-green-600 mb-1">1</div>
              <div className="text-sm text-gray-700">Excellent</div>
              <div className="text-xs text-gray-600 mt-1">
                Site-specific / &lt;1 Year / Primary &gt;95%
              </div>
            </div>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-2xl font-bold text-green-600 mb-1">2</div>
              <div className="text-sm text-gray-700">Good</div>
              <div className="text-xs text-gray-600 mt-1">
                Similar process / 1-3 Years / PDS 70-89%
              </div>
            </div>
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600 mb-1">3</div>
              <div className="text-sm text-gray-700">Fair</div>
              <div className="text-xs text-gray-600 mt-1">
                Industry average / 3-5 Years / PDS 50-69%
              </div>
            </div>
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="text-2xl font-bold text-orange-600 mb-1">4</div>
              <div className="text-sm text-gray-700">Poor</div>
              <div className="text-xs text-gray-600 mt-1">
                Proxy / 5-10 Years / PDS 30-49%
              </div>
            </div>
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-2xl font-bold text-red-600 mb-1">5</div>
              <div className="text-sm text-gray-700">Very Poor</div>
              <div className="text-xs text-gray-600 mt-1">
                Mismatch / &gt;10 Years / PDS &lt;29%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataQualityRating;
