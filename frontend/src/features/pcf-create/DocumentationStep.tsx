import React, { useState } from 'react';
import { Upload, Button, message, Progress, Tooltip } from 'antd';
import type { UploadFile, UploadProps } from 'antd';
import {
  FileText,
  Image as ImageIcon,
  Upload as UploadIcon,
  X,
  CheckCircle,
  Loader2,
  File,
  FileSpreadsheet,
  FileImage,
  ArrowRight,
  CloudUpload,
  Save,
} from 'lucide-react';
import pcfService from '../../lib/pcfService';

interface DocumentationStepProps {
  initialValues: any;
  onSave: (values: any) => void;
  onSaveAsDraft?: (values: any) => void;
}

interface ExtendedUploadFile extends UploadFile {
  fileKey?: string;
}

const DocumentationStep: React.FC<DocumentationStepProps> = ({ initialValues, onSave, onSaveAsDraft }) => {
  const [techSpecFiles, setTechSpecFiles] = useState<ExtendedUploadFile[]>(initialValues.technicalSpecifications || []);
  const [productImageFiles, setProductImageFiles] = useState<ExtendedUploadFile[]>(initialValues.productImages || []);
  const [uploadingTechSpec, setUploadingTechSpec] = useState(false);
  const [uploadingProductImage, setUploadingProductImage] = useState(false);

  const customUploadTechSpec = async (options: any) => {
    const { file, onSuccess, onError, onProgress } = options;
    setUploadingTechSpec(true);
    onProgress?.({ percent: 30 });

    try {
      const result = await pcfService.uploadBOMFile(file);
      if (result.success && result.url && result.key) {
        onProgress?.({ percent: 100 });
        onSuccess?.({ url: result.url, key: result.key }, file);
        message.success(`${file.name} uploaded successfully`);
      } else {
        onError?.(new Error(result.message || 'Upload failed'));
        message.error(`${file.name} upload failed: ${result.message}`);
      }
    } catch (error: any) {
      onError?.(error);
      message.error(`${file.name} upload failed`);
    } finally {
      setUploadingTechSpec(false);
    }
  };

  const customUploadProductImage = async (options: any) => {
    const { file, onSuccess, onError, onProgress } = options;
    setUploadingProductImage(true);
    onProgress?.({ percent: 30 });

    try {
      const result = await pcfService.uploadBOMFile(file);
      if (result.success && result.url && result.key) {
        onProgress?.({ percent: 100 });
        onSuccess?.({ url: result.url, key: result.key }, file);
        message.success(`${file.name} uploaded successfully`);
      } else {
        onError?.(new Error(result.message || 'Upload failed'));
        message.error(`${file.name} upload failed: ${result.message}`);
      }
    } catch (error: any) {
      onError?.(error);
      message.error(`${file.name} upload failed`);
    } finally {
      setUploadingProductImage(false);
    }
  };

  const handleTechSpecChange: UploadProps['onChange'] = (info) => {
    let newFileList = [...info.fileList] as ExtendedUploadFile[];
    newFileList = newFileList.slice(-10);
    newFileList = newFileList.map((file) => {
      if (file.response) {
        file.url = file.response.url;
        file.fileKey = file.response.key;
      }
      return file;
    });
    setTechSpecFiles(newFileList);
  };

  const handleProductImageChange: UploadProps['onChange'] = (info) => {
    let newFileList = [...info.fileList] as ExtendedUploadFile[];
    newFileList = newFileList.slice(-10);
    newFileList = newFileList.map((file) => {
      if (file.response) {
        file.url = file.response.url;
        file.fileKey = file.response.key;
      }
      return file;
    });
    setProductImageFiles(newFileList);
  };

  const getDocumentValues = () => {
    const uploadedTechSpecs = techSpecFiles
      .filter(f => f.status === 'done' && (f.fileKey || f.url))
      .map(f => ({
        uid: f.uid,
        name: f.name,
        url: f.url,
        fileKey: f.fileKey,
        type: f.type,
        status: f.status,
      }));

    const uploadedProductImages = productImageFiles
      .filter(f => f.status === 'done' && (f.fileKey || f.url))
      .map(f => ({
        uid: f.uid,
        name: f.name,
        url: f.url,
        fileKey: f.fileKey,
        type: f.type,
        status: f.status,
      }));

    return {
      technicalSpecifications: uploadedTechSpecs,
      productImages: uploadedProductImages,
      documents: [...uploadedTechSpecs, ...uploadedProductImages],
    };
  };

  const handleSave = () => {
    onSave(getDocumentValues());
  };

  const handleSaveAsDraft = () => {
    onSaveAsDraft?.(getDocumentValues());
  };

  const techSpecUploadProps: UploadProps = {
    customRequest: customUploadTechSpec,
    onChange: handleTechSpecChange,
    multiple: true,
    accept: '.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg',
    fileList: techSpecFiles,
    showUploadList: false,
    beforeUpload: (file) => {
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error('File must be smaller than 10MB!');
      }
      return isLt10M || Upload.LIST_IGNORE;
    },
  };

  const productImageUploadProps: UploadProps = {
    customRequest: customUploadProductImage,
    onChange: handleProductImageChange,
    multiple: true,
    accept: '.png,.jpg,.jpeg,.gif,.webp',
    fileList: productImageFiles,
    showUploadList: false,
    beforeUpload: (file) => {
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
      const isAllowed = allowedTypes.includes(file.type);
      if (!isAllowed) {
        message.error('You can only upload image files!');
      }
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error('Image must be smaller than 10MB!');
      }
      return (isAllowed && isLt10M) || Upload.LIST_IGNORE;
    },
  };

  const getFileIcon = (file: ExtendedUploadFile) => {
    const name = file.name?.toLowerCase() || '';
    if (name.endsWith('.pdf')) return <FileText className="w-5 h-5 text-red-500" />;
    if (name.endsWith('.doc') || name.endsWith('.docx')) return <FileText className="w-5 h-5 text-blue-500" />;
    if (name.endsWith('.xls') || name.endsWith('.xlsx')) return <FileSpreadsheet className="w-5 h-5 text-green-600" />;
    if (name.match(/\.(png|jpg|jpeg|gif|webp)$/)) return <FileImage className="w-5 h-5 text-purple-500" />;
    return <File className="w-5 h-5 text-gray-500" />;
  };

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toUpperCase() || 'FILE';
  };

  const formatFileSize = (size?: number) => {
    if (!size) return '';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Technical Specifications Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Technical Specifications</h3>
                <p className="text-sm text-gray-500">Datasheets, manuals, technical drawings</p>
              </div>
            </div>
            {techSpecFiles.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 rounded-full">
                <CheckCircle className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">{techSpecFiles.filter(f => f.status === 'done').length} files</span>
              </div>
            )}
          </div>
        </div>

        {/* Upload Area */}
        <div className="p-6">
          <Upload.Dragger {...techSpecUploadProps} className="!border-2 !border-dashed !border-gray-200 !rounded-xl hover:!border-blue-400 !bg-gray-50/50 transition-all">
            <div className="py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-2xl flex items-center justify-center">
                <CloudUpload className="w-8 h-8 text-blue-500" />
              </div>
              <p className="text-base font-medium text-gray-700 mb-1">
                Drop files here or <span className="text-blue-600">browse</span>
              </p>
              <p className="text-sm text-gray-400">
                PDF, DOC, DOCX, XLS, XLSX, PNG, JPG up to 10MB
              </p>
            </div>
          </Upload.Dragger>

          {/* File List */}
          {techSpecFiles.length > 0 && (
            <div className="mt-4 space-y-2">
              {techSpecFiles.map((file) => (
                <div
                  key={file.uid}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-all group"
                >
                  <div className="w-10 h-10 bg-white rounded-lg border border-gray-200 flex items-center justify-center flex-shrink-0">
                    {getFileIcon(file)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                      <span className="px-1.5 py-0.5 text-xs font-medium bg-gray-200 text-gray-600 rounded">
                        {getFileExtension(file.name || '')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {file.status === 'done' ? (
                        <span className="flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle className="w-3 h-3" />
                          Uploaded
                        </span>
                      ) : file.status === 'uploading' ? (
                        <span className="flex items-center gap-1 text-xs text-blue-600">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Uploading...
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">{formatFileSize(file.size)}</span>
                      )}
                    </div>
                  </div>
                  <Tooltip title="Remove file">
                    <button
                      onClick={() => setTechSpecFiles(techSpecFiles.filter(f => f.uid !== file.uid))}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </Tooltip>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Product Images Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Product Images</h3>
                <p className="text-sm text-gray-500">Product photos for visual reference</p>
              </div>
            </div>
            {productImageFiles.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 rounded-full">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">{productImageFiles.filter(f => f.status === 'done').length} images</span>
              </div>
            )}
          </div>
        </div>

        {/* Upload Area */}
        <div className="p-6">
          <Upload.Dragger {...productImageUploadProps} className="!border-2 !border-dashed !border-gray-200 !rounded-xl hover:!border-green-400 !bg-gray-50/50 transition-all">
            <div className="py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-2xl flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-green-500" />
              </div>
              <p className="text-base font-medium text-gray-700 mb-1">
                Drop images here or <span className="text-green-600">browse</span>
              </p>
              <p className="text-sm text-gray-400">
                PNG, JPG, JPEG, GIF, WebP up to 10MB
              </p>
            </div>
          </Upload.Dragger>

          {/* Image Grid */}
          {productImageFiles.length > 0 && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {productImageFiles.map((file) => (
                <div
                  key={file.uid}
                  className="relative group aspect-square bg-gray-100 rounded-xl border border-gray-200 overflow-hidden"
                >
                  {file.status === 'done' && file.url ? (
                    <img
                      src={file.url}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {file.status === 'uploading' ? (
                        <Loader2 className="w-6 h-6 text-green-500 animate-spin" />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-gray-300" />
                      )}
                    </div>
                  )}

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-2">
                      <p className="text-xs text-white truncate">{file.name}</p>
                    </div>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => setProductImageFiles(productImageFiles.filter(f => f.uid !== file.uid))}
                    className="absolute top-2 right-2 p-1.5 bg-white/90 text-gray-600 hover:text-red-500 hover:bg-white rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {/* Status Badge */}
                  {file.status === 'done' && (
                    <div className="absolute top-2 left-2 p-1 bg-green-500 rounded-full">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Summary Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Tech Specs</p>
                <p className="text-sm font-semibold text-gray-900">{techSpecFiles.filter(f => f.status === 'done').length} files</p>
              </div>
            </div>
            <div className="w-px h-8 bg-gray-200"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <ImageIcon className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Images</p>
                <p className="text-sm font-semibold text-gray-900">{productImageFiles.filter(f => f.status === 'done').length} files</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {onSaveAsDraft && (
              <Button
                size="large"
                onClick={handleSaveAsDraft}
                icon={<Save className="w-4 h-4" />}
              >
                Save as Draft
              </Button>
            )}
            <Button
              type="primary"
              size="large"
              onClick={handleSave}
              className="!bg-green-600 hover:!bg-green-700 !border-green-600 shadow-lg shadow-green-600/20"
              icon={<ArrowRight className="w-4 h-4" />}
              iconPosition="end"
            >
              Save & Continue
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentationStep;
