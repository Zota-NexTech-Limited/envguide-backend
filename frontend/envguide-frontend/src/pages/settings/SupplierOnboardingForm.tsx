import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Form,
  Input,
  Button,
  Select,
  Row,
  Col,
  Card,
  message,
  Spin,
  Divider,
} from "antd";
import { ArrowLeft, Truck, Save } from "lucide-react";
import userManagementService from "../../lib/userManagementService";
import { getDropdownList } from "../../lib/masterDataSetupService";
import type { SupplierOnboarding } from "../../types/userManagement";

const { Option } = Select;
const { TextArea } = Input;

const SupplierOnboardingForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [businessTypeOptions, setBusinessTypeOptions] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    loadBusinessTypeOptions();
    if (id) {
      setIsEditMode(true);
      loadSupplierData(id);
    }
  }, [id]);

  const loadBusinessTypeOptions = async () => {
    const options = await getDropdownList("supplier-tier");
    setBusinessTypeOptions(options);
  };

  const loadSupplierData = async (supplierId: string) => {
    setInitialLoading(true);
    try {
      const result = await userManagementService.getSupplierById(supplierId);
      if (result.success && result.data) {
        form.setFieldsValue({
          ...result.data,
          supplier_supplied_categories: result.data.supplier_supplied_categories?.join(", ") || "",
        });
      } else {
        message.error("Failed to load supplier data");
        navigate("/settings/users");
      }
    } catch (error) {
      console.error("Error loading supplier:", error);
      message.error("Error loading supplier data");
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      // Parse comma-separated values to arrays
      const payload = {
        ...values,
        supplier_supplied_categories: values.supplier_supplied_categories
          ? values.supplier_supplied_categories.split(",").map((s: string) => s.trim()).filter(Boolean)
          : [],
      };

      let result;
      if (isEditMode && id) {
        result = await userManagementService.updateSupplier({ ...payload, sup_id: id });
      } else {
        result = await userManagementService.createSupplier(payload);
      }

      if (result.success) {
        message.success(result.message || (isEditMode ? "Supplier updated successfully" : "Supplier created successfully"));
        navigate("/settings/users");
      } else {
        message.error(result.message || "Failed to save supplier");
      }
    } catch (error) {
      console.error("Error saving supplier:", error);
      message.error("An error occurred while saving");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/settings/users")}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {isEditMode ? "Edit Supplier" : "New Supplier Onboarding"}
                </h1>
                <p className="text-gray-500">
                  {isEditMode ? "Update supplier details" : "Register a new supplier"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
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
                      {businessTypeOptions.map((option) => (
                        <Option key={option.id} value={option.name}>
                          {option.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item name="supplier_years_in_business" label="Years in Business">
                    <Input placeholder="Enter years" />
                  </Form.Item>
                </Col>
                <Col xs={24}>
                  <Form.Item
                    name="supplier_supplied_categories"
                    label="Supplied Categories"
                    extra="Enter comma-separated values"
                  >
                    <TextArea rows={2} placeholder="e.g., Electronics, Mechanical Parts, Raw Materials" />
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
                    <TextArea rows={2} placeholder="Enter registered address" />
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
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Details</h3>
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
                  <Form.Item name="supplier_bank_account_number" label="Bank Account Number">
                    <Input placeholder="Enter bank account number" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item name="supplier_ifsc_code" label="IFSC Code">
                    <Input placeholder="Enter IFSC code" />
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
            <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
              <Button onClick={() => navigate("/settings/users")}>Cancel</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<Save size={16} />}
                className="shadow-lg shadow-green-600/20"
              >
                {isEditMode ? "Update Supplier" : "Create Supplier"}
              </Button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default SupplierOnboardingForm;
