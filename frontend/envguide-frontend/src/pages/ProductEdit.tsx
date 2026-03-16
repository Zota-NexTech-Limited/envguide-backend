import React, { useState, useEffect } from "react";
import {
  Button,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  message,
  Spin,
} from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import { Package, ArrowLeft, Save, FileText } from "lucide-react";
import productService from "../lib/productService";
import type {
  ProductCategory,
  ProductSubCategory,
  ManufacturingProcess,
  Product,
  ManufacturerUser,
} from "../lib/productService";
import { getCompositionMetalDropdown } from "../lib/masterDataSetupService";
import dayjs from "dayjs";
import { usePermissions } from "../contexts/PermissionContext";

const { TextArea } = Input;

const ProductEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canUpdate } = usePermissions();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);

  // Redirect if user doesn't have update permission
  useEffect(() => {
    if (!canUpdate("Product Portfolio")) {
      message.error("You don't have permission to edit products");
      navigate("/product-portfolio/all-products");
    }
  }, [canUpdate, navigate]);

  // Dropdown Data
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [subCategories, setSubCategories] = useState<ProductSubCategory[]>([]);
  const [manufacturingProcesses, setManufacturingProcesses] = useState<ManufacturingProcess[]>([]);
  const [materials, setMaterials] = useState<{ id: string; name: string }[]>([]);
  const [manufacturers, setManufacturers] = useState<ManufacturerUser[]>([]);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setInitialLoading(true);
      const [cats, subCats, mfgProcs, mats, mfrs] = await Promise.all([
        productService.getProductCategories(),
        productService.getProductSubCategories(),
        productService.getManufacturingProcesses(),
        getCompositionMetalDropdown(),
        productService.getManufacturers(),
      ]);

      // API returns data as array directly, not data.rows
      const catsData = cats.status ? (Array.isArray(cats.data) ? cats.data : cats.data?.rows || []) : [];
      const subCatsData = subCats.status ? (Array.isArray(subCats.data) ? subCats.data : subCats.data?.rows || []) : [];
      const mfgProcsData = mfgProcs.status ? (Array.isArray(mfgProcs.data) ? mfgProcs.data : mfgProcs.data?.rows || []) : [];
      const mfrsData = mfrs.status ? (Array.isArray(mfrs.data) ? mfrs.data : []) : [];

      setCategories(catsData);
      setSubCategories(subCatsData);
      setManufacturingProcesses(mfgProcsData);
      setMaterials(mats);
      setManufacturers(mfrsData);

      if (id) {
        const productRes = await productService.getProductById(id);
        if (productRes.status && productRes.data) {
          const prod = productRes.data;
          setProduct(prod);

          form.setFieldsValue({
            ...prod,
            ts_weight_kg: Number(prod.ts_weight_kg),
          });

        } else {
            message.error("Failed to load product details");
            navigate("/product-portfolio/all-products");
        }
      }
    } catch (error) {
      console.error("Error loading data:", error);
      message.error("Failed to load data");
    } finally {
      setInitialLoading(false);
    }
  };


  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const productData = {
        ...values,
        id: id, // Important for update
        ts_weight_kg: Number(values.ts_weight_kg),
      };

      const result = await productService.updateProduct(productData);

      if (result.status) {
        message.success(result.message || "Product updated successfully");
        navigate(`/product-portfolio/view/${id}`);
      } else {
        message.error(result.message || "Failed to update product");
      }
    } catch (error) {
      console.error("Error updating product:", error);
      message.error("An error occurred while updating the product");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
      return (
        <div className="flex justify-center items-center h-screen">
          <Spin size="large" />
        </div>
      );
  }

  return (
    <div className="p-6">
      <Spin spinning={loading}>
        <div className="space-y-6">
          {/* Header Section */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate(`/product-portfolio/view/${id}`)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <ArrowLeft size={20} className="text-gray-600" />
                </button>
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
                  <p className="text-gray-500">Update product information and attributes</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate(`/product-portfolio/view/${id}`)}
                  className="px-5 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 shadow-lg shadow-green-600/20 transition-all"
                >
                  <Save size={18} />
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          </div>

          <Form
                form={form}
                layout="vertical"
                onFinish={handleSave}
            >
                <Row gutter={24}>
                    {/* Main Content */}
                    <Col xs={24} lg={16}>
                        <div className="space-y-6">
                            {/* Basic Information */}
                            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-3">
                                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                                    <Package className="w-5 h-5 text-green-600" />
                                  </div>
                                  Basic Information
                                </h3>
                                <Row gutter={24}>
                                    <Col xs={24} md={12}>
                                        <Form.Item
                                            label="Product Name"
                                            name="product_name"
                                            rules={[{ required: true, message: "Required" }]}
                                        >
                                            <Input size="large" />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <Form.Item
                                            label="Product Code"
                                            name="product_code"
                                            rules={[{ required: true, message: "Required" }]}
                                        >
                                            <Input size="large" />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <Form.Item
                                            label="Category"
                                            name="product_category_id"
                                            rules={[{ required: true, message: "Required" }]}
                                        >
                                            <Select
                                                size="large"
                                                options={categories.map(c => ({ label: c.name, value: c.id }))}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <Form.Item
                                            label="Sub-Category"
                                            name="product_sub_category_id"
                                            rules={[{ required: true, message: "Required" }]}
                                        >
                                            <Select
                                                size="large"
                                                options={subCategories.map(sc => ({ label: sc.name, value: sc.id }))}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <Form.Item
                                            label="Client/Manufacturer"
                                            name="client_or_manufacturer_ids"
                                        >
                                            <Select
                                                size="large"
                                                mode="multiple"
                                                allowClear
                                                placeholder="Select client or manufacturer"
                                                options={manufacturers.map(m => ({ label: m.user_name, value: m.user_id }))}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={24}>
                                        <Form.Item
                                            label="Description"
                                            name="description"
                                            rules={[{ required: true, message: "Required" }]}
                                        >
                                            <TextArea rows={3} />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </div>

                            {/* Technical Specifications */}
                            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-3">
                                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                    <Package className="w-5 h-5 text-blue-600" />
                                  </div>
                                  Technical Specifications
                                </h3>
                                <Row gutter={24}>
                                    <Col xs={24} md={8}>
                                        <Form.Item
                                            label="Weight (kg)"
                                            name="ts_weight_kg"
                                            rules={[{ required: true, message: "Required" }]}
                                        >
                                            <InputNumber className="w-full" size="large" min={0} step={0.01} />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={8}>
                                        <Form.Item
                                            label="Dimensions (L×W×H)"
                                            name="ts_dimensions"
                                            rules={[{ required: true, message: "Required" }]}
                                        >
                                            <Input size="large" />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={8}>
                                        <Form.Item
                                            label="Material"
                                            name="ts_material"
                                            rules={[{ required: true, message: "Required" }]}
                                        >
                                            <Select
                                                size="large"
                                                placeholder="Select material"
                                                showSearch
                                                optionFilterProp="label"
                                                options={materials.map((m) => ({
                                                    label: m.name,
                                                    value: m.name,
                                                }))}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={8}>
                                        <Form.Item
                                            label="Manufacturing Process"
                                            name="ts_manufacturing_process_id"
                                            rules={[{ required: true, message: "Required" }]}
                                        >
                                            <Select
                                                size="large"
                                                options={manufacturingProcesses.map(mp => ({ label: mp.name, value: mp.id }))}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={8}>
                                        <Form.Item
                                            label="Supplier"
                                            name="ts_supplier"
                                            rules={[{ required: true, message: "Required" }]}
                                        >
                                            <Input size="large" />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={8}>
                                        <Form.Item
                                            label="Part Number"
                                            name="ts_part_number"
                                            rules={[{ required: true, message: "Required" }]}
                                        >
                                            <Input size="large" />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </div>

                        </div>
                    </Col>

                    {/* Sidebar */}
                    <Col xs={24} lg={8}>
                        <div className="space-y-6">
                            {/* Status & Settings */}
                            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                                <h3 className="text-lg font-semibold text-gray-900 mb-6">Status & Settings</h3>
                                <Form.Item label="Product Status" name="product_status" className="mb-4">
                                    <Select size="large" placeholder="Select status">
                                        <Select.Option value="">No Status</Select.Option>
                                        <Select.Option value="Active">Active</Select.Option>
                                        <Select.Option value="Inactive">Inactive</Select.Option>
                                        <Select.Option value="Draft">Draft</Select.Option>
                                    </Select>
                                </Form.Item>
                                <Form.Item label="Own Emission ID" name="own_emission_id" className="mb-4">
                                    <Input size="large" placeholder="Optional" />
                                </Form.Item>
                                <Form.Item label="Own Emission Status" name="own_emission_status" className="mb-0">
                                    <Select size="large" placeholder="Select status" allowClear>
                                        <Select.Option value="">No Status</Select.Option>
                                        <Select.Option value="Approved">Approved</Select.Option>
                                        <Select.Option value="Pending">Pending</Select.Option>
                                        <Select.Option value="Rejected">Rejected</Select.Option>
                                    </Select>
                                </Form.Item>
                            </div>

                            {/* Documents */}
                            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Documents</h3>
                                <div className="mb-3">
                                    <span className="text-gray-500 text-sm">Product documents can be managed via PCF requests in Document Master.</span>
                                </div>
                                <Button
                                    type="default"
                                    icon={<FileText className="w-4 h-4" />}
                                    onClick={() => navigate("/document-master")}
                                    className="w-full"
                                >
                                    Go to Document Master
                                </Button>
                            </div>

                            {/* Audit Information */}
                            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Audit Information</h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Created By:</span>
                                        <span className="font-medium">{product?.created_by_name || "System"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Created Date:</span>
                                        <span className="font-medium">{product?.created_date ? dayjs(product.created_date).format("DD MMM YYYY") : "-"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Last Modified By:</span>
                                        <span className="font-medium">{product?.updated_by_name || "-"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Last Modified:</span>
                                        <span className="font-medium">{product?.update_date ? dayjs(product.update_date).format("DD MMM YYYY") : "-"}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Col>
                </Row>
            </Form>
          </div>
        </Spin>
      </div>
  );
};

export default ProductEdit;
