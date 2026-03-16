import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Tag,
  Space,
  Input,
  Select,
  message,
  Spin,
  Drawer,
  Upload,
  Image,
  Popconfirm,
} from "antd";
import type { UploadProps } from "antd";
import {
  FileText,
  Search,
  Eye,
  File,
  CheckCircle,
  XCircle,
  X,
  Upload as UploadIcon,
  Image as ImageIcon,
  FileType,
  PlayCircle,
} from "lucide-react";
import { documentMasterService } from "../lib/documentMasterService";
import type { PCFDocumentItem, DocumentStats } from "../lib/documentMasterService";
import pcfService from "../lib/pcfService";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { usePermissions } from "../contexts/PermissionContext";

dayjs.extend(relativeTime);

const { Option } = Select;

const DocumentMaster: React.FC = () => {
  const { canUpdate } = usePermissions();
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<PCFDocumentItem[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [apiStats, setApiStats] = useState<DocumentStats | null>(null);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<PCFDocumentItem | null>(
    null,
  );
  const [techSpecFiles, setTechSpecFiles] = useState<string[]>([]);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [fileUrls, setFileUrls] = useState<Record<string, string>>({});
  const [loadingUrls, setLoadingUrls] = useState(false);

  const fetchDocuments = async (page: number = 1, pageSize: number = 20) => {
    setLoading(true);
    try {
      const result = await documentMasterService.getDocumentList(
        page,
        pageSize,
      );
      if (result.status && result.data) {
        setDocuments(result.data.data || []);
        // Handle pagination from result.data.pagination
        const paginationData = result.data.pagination;
        if (paginationData) {
          setPagination({
            current: paginationData.page || page,
            pageSize: paginationData.limit || pageSize,
            total: paginationData.total || 0,
          });
        } else {
          // Fallback to old structure
          setPagination({
            current: result.data.page || page,
            pageSize: result.data.pageSize || pageSize,
            total: result.data.totalCount || 0,
          });
        }
        // Set stats from API response
        if (result.data.stats) {
          setApiStats(result.data.stats);
        }
      } else {
        message.error(result.message || "Failed to fetch documents");
      }
    } catch (error) {
      message.error("Failed to fetch documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleTableChange = (newPagination: any) => {
    fetchDocuments(newPagination.current, newPagination.pageSize);
  };

  const fetchFileUrls = async (files: string[]) => {
    setLoadingUrls(true);
    const urls: Record<string, string> = {};

    await Promise.all(
      files.map(async (file) => {
        try {
          const result = await documentMasterService.getFileUrl(file);
          if (result.success && result.url) {
            urls[file] = result.url;
          }
        } catch (error) {
          console.error(`Error fetching URL for ${file}:`, error);
        }
      }),
    );

    setFileUrls(urls);
    setLoadingUrls(false);
  };

  const openDrawer = async (record: PCFDocumentItem) => {
    setSelectedRecord(record);
    setTechSpecFiles([...(record.technical_specification_file || [])]);
    setProductImages([...(record.product_images || [])]);
    setHasChanges(false);
    setFileUrls({});
    setDrawerOpen(true);

    // Fetch signed URLs for all files
    const allFiles = [
      ...(record.technical_specification_file || []),
      ...(record.product_images || []),
    ];
    if (allFiles.length > 0) {
      fetchFileUrls(allFiles);
    }
  };

  const closeDrawer = () => {
    if (hasChanges) {
      if (
        !window.confirm(
          "You have unsaved changes. Are you sure you want to close?",
        )
      ) {
        return;
      }
    }
    setDrawerOpen(false);
    setSelectedRecord(null);
    setTechSpecFiles([]);
    setProductImages([]);
    setHasChanges(false);
    setFileUrls({});
  };

  const handleSaveDocuments = async () => {
    if (!selectedRecord) return;

    setSaving(true);
    try {
      const result = await documentMasterService.updateDocuments({
        id: selectedRecord.id,
        technical_specification_file: techSpecFiles,
        product_images: productImages,
      });

      if (result.success) {
        message.success("Documents updated successfully");
        setHasChanges(false);
        setDrawerOpen(false);
        fetchDocuments(pagination.current, pagination.pageSize);
      } else {
        message.error(result.message || "Failed to update documents");
      }
    } catch (error) {
      message.error("Failed to update documents");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveTechSpec = (index: number) => {
    const newFiles = techSpecFiles.filter((_, i) => i !== index);
    setTechSpecFiles(newFiles);
    setHasChanges(true);
  };

  const handleRemoveProductImage = (index: number) => {
    const newImages = productImages.filter((_, i) => i !== index);
    setProductImages(newImages);
    setHasChanges(true);
  };

  const handleUpload = async (
    file: File,
    type: "techSpec" | "productImage",
  ) => {
    setUploading(true);
    try {
      const result = await pcfService.uploadBOMFile(file);
      if (result.success && result.key) {
        const fileKey = result.key;
        if (type === "techSpec") {
          setTechSpecFiles([...techSpecFiles, fileKey]);
        } else {
          setProductImages([...productImages, fileKey]);
        }
        setHasChanges(true);
        message.success(`${file.name} uploaded successfully`);

        // Fetch signed URL for the new file
        const urlResult = await documentMasterService.getFileUrl(fileKey);
        if (urlResult.success && urlResult.url) {
          setFileUrls((prev) => ({ ...prev, [fileKey]: urlResult.url }));
        }
      } else {
        message.error(result.message || "Upload failed");
      }
    } catch (error) {
      message.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const techSpecUploadProps: UploadProps = {
    beforeUpload: (file) => {
      handleUpload(file, "techSpec");
      return false;
    },
    showUploadList: false,
    accept: ".pdf,.png,.jpg,.jpeg,.doc,.docx",
  };

  const productImageUploadProps: UploadProps = {
    beforeUpload: (file) => {
      handleUpload(file, "productImage");
      return false;
    },
    showUploadList: false,
    accept: ".png,.jpg,.jpeg,.gif,.webp",
  };

  const getFileUrl = (filePath: string) => {
    return fileUrls[filePath] || "";
  };

  const getFileName = (filePath: string) => {
    const parts = filePath.split("/");
    const fullName = parts[parts.length - 1];
    // Remove the UUID prefix if present (format: IMG-timestamp-uuid-filename)
    const match = fullName.match(/IMG-\d+-[\w-]+-(.+)/);
    return match ? match[1] : fullName;
  };

  const isImageFile = (filePath: string) => {
    const ext = filePath.toLowerCase().split(".").pop();
    return ["png", "jpg", "jpeg", "gif", "webp"].includes(ext || "");
  };

  // Use stats from API response for KPI cards
  const stats = {
    total: parseInt(apiStats?.total_pcf_count || "0", 10),
    approved: parseInt(apiStats?.approved_count || "0", 10),
    inProgress: parseInt(apiStats?.in_progress_count || "0", 10),
    rejected: parseInt(apiStats?.rejected_count || "0", 10),
    draft: parseInt(apiStats?.draft_count || "0", 10),
    pending: parseInt(apiStats?.pending_count || "0", 10),
  };

  const columns = [
    {
      title: "PCF Request",
      key: "pcf_request",
      render: (_: any, record: PCFDocumentItem) => (
        <Space>
          <div className="p-2 bg-green-100 rounded-xl">
            <FileText size={20} className="text-green-600" />
          </div>
          <Space direction="vertical" size={0}>
            <span className="font-medium text-gray-900">
              {record.request_title}
            </span>
            <span className="text-xs text-gray-500">{record.code}</span>
          </Space>
        </Space>
      ),
    },
    {
      title: "Product Code",
      dataIndex: "product_code",
      key: "product_code",
      render: (text: string) => (
        <span className="text-gray-700">{text || "-"}</span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        let color = "default";
        if (status === "Approved") color = "success";
        if (status === "Pending") color = "warning";
        if (status === "Rejected") color = "error";
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: "Documents",
      key: "documents",
      render: (_: any, record: PCFDocumentItem) => {
        const techCount = record.technical_specification_file?.length || 0;
        const imageCount = record.product_images?.length || 0;
        const total = techCount + imageCount;
        return (
          <Space size="small">
            <Tag color="blue" className="rounded-full">
              <FileType size={12} className="inline mr-1" />
              {techCount} specs
            </Tag>
            <Tag color="purple" className="rounded-full">
              <ImageIcon size={12} className="inline mr-1" />
              {imageCount} images
            </Tag>
          </Space>
        );
      },
    },
    {
      title: "Last Modified",
      dataIndex: "update_date",
      key: "update_date",
      responsive: ["lg"] as const,
      render: (date: string) => dayjs(date).format("DD MMM YYYY"),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: PCFDocumentItem) => (
        <Button
          type="primary"
          icon={<Eye size={16} />}
          onClick={() => openDrawer(record)}
          className="shadow-lg shadow-green-600/20"
        >
          View / Edit
        </Button>
      ),
    },
  ];

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.request_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.product_code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || doc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center flex-wrap gap-6">
            {/* Left Section - Title and Description */}
            <div className="flex-1 min-w-[300px]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Document Master
                  </h1>
                  <p className="text-gray-500">
                    Manage documents attached to PCF requests
                  </p>
                </div>
              </div>
            </div>

            {/* Right Section - Summary Cards */}
            <div className="flex gap-3 flex-wrap">
              {/* Total */}
              <div className="bg-purple-50 rounded-xl p-4 min-w-[120px] border border-purple-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-100 w-10 h-10 rounded-xl flex items-center justify-center">
                    <File className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-xs text-purple-600 font-medium">
                      Total
                    </div>
                    <div className="text-xl font-bold text-purple-700">
                      {stats.total}
                    </div>
                  </div>
                </div>
              </div>

              {/* Approved */}
              <div className="bg-green-50 rounded-xl p-4 min-w-[120px] border border-green-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 w-10 h-10 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-xs text-green-600 font-medium">
                      Approved
                    </div>
                    <div className="text-xl font-bold text-green-700">
                      {stats.approved}
                    </div>
                  </div>
                </div>
              </div>

              {/* In Progress */}
              <div className="bg-cyan-50 rounded-xl p-4 min-w-[120px] border border-cyan-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="bg-cyan-100 w-10 h-10 rounded-xl flex items-center justify-center">
                    <PlayCircle className="w-5 h-5 text-cyan-600" />
                  </div>
                  <div>
                    <div className="text-xs text-cyan-600 font-medium">
                      In Progress
                    </div>
                    <div className="text-xl font-bold text-cyan-700">
                      {stats.inProgress}
                    </div>
                  </div>
                </div>
              </div>

              {/* Rejected */}
              <div className="bg-red-50 rounded-xl p-4 min-w-[120px] border border-red-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="bg-red-100 w-10 h-10 rounded-xl flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <div className="text-xs text-red-600 font-medium">
                      Rejected
                    </div>
                    <div className="text-xl font-bold text-red-700">
                      {stats.rejected}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Documents Section */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
            <h2 className="text-lg font-semibold text-gray-900">
              PCF Documents
            </h2>
            <Space wrap>
              <Input
                prefix={<Search size={16} className="text-gray-400" />}
                placeholder="Search by code, title, product..."
                className="w-[250px]"
                size="large"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Select
                defaultValue="all"
                className="w-[140px]"
                size="large"
                value={statusFilter}
                onChange={(value) => setStatusFilter(value)}
              >
                <Option value="all">All Status</Option>
                <Option value="Approved">Approved</Option>
                <Option value="In Progress">In Progress</Option>
                <Option value="Rejected">Rejected</Option>
              </Select>
            </Space>
          </div>

          <Spin spinning={loading}>
            <Table
              columns={columns as any}
              dataSource={filteredDocuments}
              rowKey="id"
              loading={loading}
              pagination={false}
              scroll={{ x: 900 }}
              className="rounded-xl overflow-hidden"
            />
          </Spin>

          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
            <div className="text-gray-500 text-sm">
              Showing{" "}
              <span className="font-medium text-gray-900">
                {Math.min(
                  (pagination.current - 1) * pagination.pageSize + 1,
                  pagination.total,
                )}
              </span>{" "}
              to{" "}
              <span className="font-medium text-gray-900">
                {Math.min(
                  pagination.current * pagination.pageSize,
                  pagination.total,
                )}
              </span>{" "}
              of{" "}
              <span className="font-medium text-gray-900">
                {pagination.total}
              </span>{" "}
              entries
            </div>
            <div className="flex items-center gap-1">
              <button
                disabled={pagination.current === 1}
                onClick={() =>
                  handleTableChange({
                    ...pagination,
                    current: pagination.current - 1,
                  })
                }
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Previous
              </button>
              {Array.from(
                {
                  length: Math.min(
                    Math.ceil(pagination.total / pagination.pageSize),
                    5,
                  ),
                },
                (_, i) => i + 1,
              ).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() =>
                    handleTableChange({ ...pagination, current: pageNum })
                  }
                  className={`w-9 h-9 rounded-lg font-medium transition-all ${
                    pagination.current === pageNum
                      ? "bg-green-600 text-white shadow-lg shadow-green-600/20"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {pageNum}
                </button>
              ))}
              <button
                disabled={
                  pagination.current >=
                  Math.ceil(pagination.total / pagination.pageSize)
                }
                onClick={() =>
                  handleTableChange({
                    ...pagination,
                    current: pagination.current + 1,
                  })
                }
                className="px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-green-600/20"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Document Edit Drawer */}
      <Drawer
        title={
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <FileText size={20} className="text-green-600" />
            </div>
            <div>
              <div className="font-semibold text-gray-900">
                {selectedRecord?.code}
              </div>
              <div className="text-sm text-gray-500">
                {selectedRecord?.request_title}
              </div>
            </div>
          </div>
        }
        placement="right"
        width={520}
        onClose={closeDrawer}
        open={drawerOpen}
        footer={
          <div className="flex justify-end gap-3">
            <Button onClick={closeDrawer}>Cancel</Button>
            {canUpdate("Document Master") && (
              <Button
                type="primary"
                onClick={handleSaveDocuments}
                loading={saving}
                disabled={!hasChanges}
                className="shadow-lg shadow-green-600/20 !text-white"
              >
                Save Changes
              </Button>
            )}
          </div>
        }
      >
        <Spin spinning={uploading || loadingUrls}>
          <div className="space-y-6">
            {/* Technical Specifications Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <FileType size={18} className="text-blue-600" />
                  Technical Specifications
                </h3>
                {canUpdate("Document Master") && (
                  <Upload {...techSpecUploadProps}>
                    <Button icon={<UploadIcon size={14} />} size="small">
                      Add File
                    </Button>
                  </Upload>
                )}
              </div>
              <div className="space-y-2">
                {techSpecFiles.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    <FileType
                      size={32}
                      className="mx-auto text-gray-400 mb-2"
                    />
                    <p className="text-gray-500 text-sm">
                      No technical specification files
                    </p>
                  </div>
                ) : (
                  techSpecFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                    >
                      {getFileUrl(file) ? (
                        <a
                          href={getFileUrl(file)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 flex-1 truncate"
                        >
                          <File size={16} />
                          <span className="truncate">{getFileName(file)}</span>
                        </a>
                      ) : (
                        <div className="flex items-center gap-2 text-gray-500 flex-1 truncate">
                          <File size={16} />
                          <span className="truncate">{getFileName(file)}</span>
                        </div>
                      )}
                      {canUpdate("Document Master") && (
                        <Popconfirm
                          title="Remove this file?"
                          onConfirm={() => handleRemoveTechSpec(index)}
                          okText="Yes"
                          cancelText="No"
                        >
                          <button className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                            <X size={16} />
                          </button>
                        </Popconfirm>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Product Images Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <ImageIcon size={18} className="text-purple-600" />
                  Product Images
                </h3>
                {canUpdate("Document Master") && (
                  <Upload {...productImageUploadProps}>
                    <Button icon={<UploadIcon size={14} />} size="small">
                      Add Image
                    </Button>
                  </Upload>
                )}
              </div>
              <div className="space-y-2">
                {productImages.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    <ImageIcon
                      size={32}
                      className="mx-auto text-gray-400 mb-2"
                    />
                    <p className="text-gray-500 text-sm">No product images</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {productImages.map((file, index) => (
                      <div
                        key={index}
                        className="relative group rounded-lg overflow-hidden border border-gray-200 hover:border-gray-300 transition-colors"
                      >
                        {isImageFile(file) && getFileUrl(file) ? (
                          <Image
                            src={getFileUrl(file)}
                            alt={getFileName(file)}
                            className="w-full h-32 object-cover"
                            preview={{
                              mask: <Eye size={20} />,
                            }}
                          />
                        ) : getFileUrl(file) ? (
                          <a
                            href={getFileUrl(file)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center h-32 bg-gray-100"
                          >
                            <File size={32} className="text-gray-400" />
                          </a>
                        ) : (
                          <div className="flex items-center justify-center h-32 bg-gray-100">
                            <File size={32} className="text-gray-300" />
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                          <span className="text-white text-xs truncate block">
                            {getFileName(file)}
                          </span>
                        </div>
                        {canUpdate("Document Master") && (
                          <Popconfirm
                            title="Remove this image?"
                            onConfirm={() => handleRemoveProductImage(index)}
                            okText="Yes"
                            cancelText="No"
                          >
                            <button className="absolute top-2 right-2 p-1 bg-white/80 text-gray-600 hover:text-red-600 hover:bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                              <X size={14} />
                            </button>
                          </Popconfirm>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Spin>
      </Drawer>
    </div>
  );
};

export default DocumentMaster;
