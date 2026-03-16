import React, { useState } from 'react';
import { Button, Tag, Modal, Image, Spin, message } from 'antd';
import {
  FileText,
  Package,
  Calendar,
  Building2,
  Flag,
  Edit3,
  Eye,
  Download,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Info,
  Clock,
  Send,
  ClipboardList,
  Image as ImageIcon,
  File,
  FileSpreadsheet,
  Save,
} from 'lucide-react';
import dayjs from 'dayjs';
import BomTable from './BomTable';
import pcfService from '../../lib/pcfService';

interface ReviewSubmitStepProps {
  formData: any;
  onEditStep: (step: number) => void;
  onSubmit: () => void;
  onSaveAsDraft?: () => void;
}

const ReviewSubmitStep: React.FC<ReviewSubmitStepProps> = ({ formData, onEditStep, onSubmit, onSaveAsDraft }) => {
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const isImageFile = (item: any) => {
    return item.name?.toLowerCase().match(/\.(png|jpg|jpeg|gif|webp)$/i) || item.type?.startsWith('image/');
  };

  const handlePreview = async (item: any) => {
    if (!item.fileKey) {
      message.error('File key not found');
      return;
    }

    setPreviewTitle(item.name || 'Preview');
    setPreviewVisible(true);
    setPreviewLoading(true);

    try {
      const result = await pcfService.fetchImage(item.fileKey);
      if (result.success && result.url) {
        setPreviewImage(result.url);
      } else {
        message.error(result.message || 'Failed to load image');
        setPreviewVisible(false);
      }
    } catch (error) {
      message.error('Failed to load image');
      setPreviewVisible(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownload = async (item: any) => {
    if (!item.fileKey) {
      message.error('File key not found');
      return;
    }

    setDownloadingId(item.uid);

    try {
      const result = await pcfService.fetchImage(item.fileKey);
      if (result.success && result.url) {
        const response = await fetch(result.url);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = item.name || 'document';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
      } else {
        message.error(result.message || 'Failed to download file');
      }
    } catch (error) {
      message.error('Failed to download file');
    } finally {
      setDownloadingId(null);
    }
  };

  const getFileIcon = (item: any) => {
    const name = item.name?.toLowerCase() || '';
    if (name.endsWith('.pdf')) return <FileText className="w-5 h-5 text-red-500" />;
    if (name.endsWith('.doc') || name.endsWith('.docx')) return <FileText className="w-5 h-5 text-blue-500" />;
    if (name.endsWith('.xls') || name.endsWith('.xlsx')) return <FileSpreadsheet className="w-5 h-5 text-green-600" />;
    if (name.match(/\.(png|jpg|jpeg|gif|webp)$/)) return <ImageIcon className="w-5 h-5 text-purple-500" />;
    return <File className="w-5 h-5 text-gray-500" />;
  };

  const priorityColor = formData.priority === 'High' ? 'red' : formData.priority === 'Medium' ? 'orange' : 'green';

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-1">Review & Submit</h2>
            <p className="text-green-100">Please review all details before submitting your PCF request</p>
          </div>
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
            <ClipboardList className="w-8 h-8 text-white" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/10 rounded-xl p-3">
            <div className="flex items-center gap-2 text-green-100 text-sm mb-1">
              <Calendar className="w-4 h-4" />
              <span>Created</span>
            </div>
            <p className="font-semibold">{dayjs().format('MMM D, YYYY')}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <div className="flex items-center gap-2 text-green-100 text-sm mb-1">
              <Clock className="w-4 h-4" />
              <span>Due Date</span>
            </div>
            <p className="font-semibold">{formData.dueDate ? dayjs(formData.dueDate).format('MMM D, YYYY') : '-'}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <div className="flex items-center gap-2 text-green-100 text-sm mb-1">
              <Flag className="w-4 h-4" />
              <span>Priority</span>
            </div>
            <Tag color={priorityColor} className="!m-0">{formData.priority || 'Medium'}</Tag>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <div className="flex items-center gap-2 text-green-100 text-sm mb-1">
              <ClipboardList className="w-4 h-4" />
              <span>Components</span>
            </div>
            <p className="font-semibold">{formData.bomData?.length || 0} items</p>
          </div>
        </div>
      </div>

      {/* Basic Information & Product Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Basic Information</h3>
            </div>
            <button
              onClick={() => onEditStep(0)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-green-600 hover:bg-green-100 rounded-lg transition-colors text-sm font-medium"
            >
              <Edit3 className="w-4 h-4" />
              Edit
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Request Title</p>
              <p className="font-medium text-gray-900">{formData.title || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Organization</p>
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-gray-400" />
                <p className="font-medium text-gray-900">{formData.organization || '-'}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Description</p>
              <p className="text-gray-600 text-sm">{formData.description || 'No description provided'}</p>
            </div>
          </div>
        </div>

        {/* Product Details */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-green-50 to-teal-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Product Details</h3>
            </div>
            <button
              onClick={() => onEditStep(1)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-green-600 hover:bg-green-100 rounded-lg transition-colors text-sm font-medium"
            >
              <Edit3 className="w-4 h-4" />
              Edit
            </button>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Product Category</p>
                <p className="font-medium text-gray-900">{formData.productCategoryName || formData.productCategory || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Component Category</p>
                <p className="font-medium text-gray-900">{formData.componentCategoryName || formData.componentCategory || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Component Type</p>
                <p className="font-medium text-gray-900">{formData.componentTypeName || formData.componentType || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Product Code</p>
                <p className="font-medium text-gray-900">{formData.productCode || '-'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bill of Materials */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-cyan-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Bill of Materials</h3>
              <p className="text-sm text-gray-500">{formData.bomData?.length || 0} components</p>
            </div>
          </div>
          <button
            onClick={() => onEditStep(1)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors text-sm font-medium"
          >
            <Edit3 className="w-4 h-4" />
            Edit
          </button>
        </div>
        <div className="p-6">
          <BomTable bomData={formData.bomData || []} readOnly={true} />
        </div>
      </div>

      {/* Documents Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Technical Specifications */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Technical Specs</h3>
                <p className="text-sm text-gray-500">{formData.technicalSpecifications?.length || 0} files</p>
              </div>
            </div>
            <button
              onClick={() => onEditStep(2)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors text-sm font-medium"
            >
              <Edit3 className="w-4 h-4" />
              Edit
            </button>
          </div>
          <div className="p-4">
            {(formData.technicalSpecifications?.length || 0) === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <FileText className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                <p className="text-sm">No files uploaded</p>
              </div>
            ) : (
              <div className="space-y-2">
                {formData.technicalSpecifications?.map((item: any) => (
                  <div key={item.uid} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl group">
                    <div className="w-10 h-10 bg-white rounded-lg border border-gray-200 flex items-center justify-center">
                      {getFileIcon(item)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                      <p className="text-xs text-gray-500">Uploaded</p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {isImageFile(item) && (
                        <button onClick={() => handlePreview(item)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => handleDownload(item)} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg">
                        {downloadingId === item.uid ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Product Images */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Product Images</h3>
                <p className="text-sm text-gray-500">{formData.productImages?.length || 0} images</p>
              </div>
            </div>
            <button
              onClick={() => onEditStep(2)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-green-600 hover:bg-green-100 rounded-lg transition-colors text-sm font-medium"
            >
              <Edit3 className="w-4 h-4" />
              Edit
            </button>
          </div>
          <div className="p-4">
            {(formData.productImages?.length || 0) === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <ImageIcon className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                <p className="text-sm">No images uploaded</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {formData.productImages?.map((item: any) => (
                  <div key={item.uid} className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer" onClick={() => handlePreview(item)}>
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-gray-300" />
                    </div>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Eye className="w-6 h-6 text-white" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Validation Status */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Validation Status</h3>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-green-800">All required fields completed</p>
              <p className="text-sm text-green-600">Basic information, product details, and documentation are ready</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-green-800">BOM validation passed</p>
              <p className="text-sm text-green-600">All components have valid specifications</p>
            </div>
          </div>
          {formData.priority === 'High' && (
            <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="font-medium text-amber-800">High priority request</p>
                <p className="text-sm text-amber-600">This will require expedited review</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Info className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-blue-800">Estimated processing: 7-10 business days</p>
              <p className="text-sm text-blue-600">Based on current workload and request complexity</p>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Footer */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-500">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-sm">All validations passed. Ready to submit.</span>
          </div>
          <div className="flex items-center gap-3">
            {onSaveAsDraft && (
              <Button
                size="large"
                onClick={onSaveAsDraft}
                icon={<Save className="w-4 h-4" />}
              >
                Save as Draft
              </Button>
            )}
            <Button
              type="primary"
              size="large"
              onClick={onSubmit}
              className="!bg-green-600 hover:!bg-green-700 !border-green-600 shadow-lg shadow-green-600/20"
              icon={<Send className="w-4 h-4" />}
            >
              Submit Request
            </Button>
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      <Modal
        open={previewVisible}
        title={previewTitle}
        footer={null}
        onCancel={() => { setPreviewVisible(false); setPreviewImage(''); }}
        width={800}
        centered
        destroyOnClose
      >
        <div className="flex justify-center items-center min-h-[200px]">
          {previewLoading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-10 h-10 text-green-500 animate-spin" />
              <p className="text-gray-500">Loading image...</p>
            </div>
          ) : (
            <Image
              alt={previewTitle}
              src={previewImage}
              style={{ maxHeight: '70vh' }}
              preview={false}
            />
          )}
        </div>
      </Modal>
    </div>
  );
};

export default ReviewSubmitStep;
