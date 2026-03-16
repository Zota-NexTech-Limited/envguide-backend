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
import { ArrowLeft, Factory, Save } from "lucide-react";
import userManagementService from "../../lib/userManagementService";
import type { ManufacturerOnboarding } from "../../types/userManagement";

const { Option } = Select;
const { TextArea } = Input;

const ManufacturerOnboardingForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    if (id) {
      setIsEditMode(true);
      loadManufacturerData(id);
    }
  }, [id]);

  const loadManufacturerData = async (manufacturerId: string) => {
    setInitialLoading(true);
    try {
      const result = await userManagementService.getManufacturerById(manufacturerId);
      if (result.success && result.data) {
        form.setFieldsValue({
          ...result.data,
          manufacturing_capabilities: result.data.manufacturing_capabilities?.join(", ") || "",
          key_oem_clients: result.data.key_oem_clients?.join(", ") || "",
        });
      } else {
        message.error("Failed to load manufacturer data");
        navigate("/settings/users");
      }
    } catch (error) {
      console.error("Error loading manufacturer:", error);
      message.error("Error loading manufacturer data");
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
        manufacturing_capabilities: values.manufacturing_capabilities
          ? values.manufacturing_capabilities.split(",").map((s: string) => s.trim()).filter(Boolean)
          : [],
        key_oem_clients: values.key_oem_clients
          ? values.key_oem_clients.split(",").map((s: string) => s.trim()).filter(Boolean)
          : [],
      };

      let result;
      if (isEditMode && id) {
        result = await userManagementService.updateManufacturer({ ...payload, id });
      } else {
        result = await userManagementService.createManufacturer(payload);
      }

      if (result.success) {
        message.success(result.message || (isEditMode ? "Manufacturer updated successfully" : "Manufacturer created successfully"));
        navigate("/settings/users");
      } else {
        message.error(result.message || "Failed to save manufacturer");
      }
    } catch (error) {
      console.error("Error saving manufacturer:", error);
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
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Factory className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {isEditMode ? "Edit Manufacturer" : "New Manufacturer Onboarding"}
                </h1>
                <p className="text-gray-500">
                  {isEditMode ? "Update manufacturer details" : "Register a new manufacturer"}
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
                    name="name"
                    label="Company Name"
                    rules={[{ required: true, message: "Please enter company name" }]}
                  >
                    <Input placeholder="Enter company name" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    name="email"
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
                    name="phone_number"
                    label="Phone Number"
                    rules={[{ required: true, message: "Please enter phone number" }]}
                  >
                    <Input placeholder="Enter phone number" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item name="alternate_phone_number" label="Alternate Phone">
                    <Input placeholder="Enter alternate phone" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item name="company_website" label="Website">
                    <Input placeholder="Enter website URL" />
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
                  <Form.Item
                    name="address"
                    label="Address"
                    rules={[{ required: true, message: "Please enter address" }]}
                  >
                    <TextArea rows={2} placeholder="Enter address" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    name="city"
                    label="City"
                    rules={[{ required: true, message: "Please enter city" }]}
                  >
                    <Input placeholder="Enter city" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    name="state"
                    label="State"
                    rules={[{ required: true, message: "Please enter state" }]}
                  >
                    <Input placeholder="Enter state" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    name="country"
                    label="Country"
                    rules={[{ required: true, message: "Please enter country" }]}
                  >
                    <Input placeholder="Enter country" />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            <Divider />

            {/* Factory Details */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Factory Details</h3>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item name="factory_or_plant_name" label="Factory/Plant Name">
                    <Input placeholder="Enter factory name" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="factory_address" label="Factory Address">
                    <Input placeholder="Enter factory address" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item name="years_of_operation" label="Years of Operation">
                    <Input placeholder="Enter years" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item name="number_of_employees" label="Number of Employees">
                    <Input placeholder="Enter number" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item name="installed_capacity_or_month" label="Installed Capacity/Month">
                    <Input placeholder="Enter capacity" />
                  </Form.Item>
                </Col>
                <Col xs={24}>
                  <Form.Item
                    name="manufacturing_capabilities"
                    label="Manufacturing Capabilities"
                    extra="Enter comma-separated values"
                  >
                    <TextArea rows={2} placeholder="e.g., CNC Machining, Die Casting, Assembly" />
                  </Form.Item>
                </Col>
                <Col xs={24}>
                  <Form.Item
                    name="key_oem_clients"
                    label="Key OEM Clients"
                    extra="Enter comma-separated values"
                  >
                    <TextArea rows={2} placeholder="e.g., Toyota, Honda, Ford" />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            <Divider />

            {/* Contact Person */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Person</h3>
              <Row gutter={16}>
                <Col xs={24} md={6}>
                  <Form.Item name="contact_person_name" label="Name">
                    <Input placeholder="Enter name" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={6}>
                  <Form.Item name="contact_person_designation" label="Designation">
                    <Input placeholder="Enter designation" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={6}>
                  <Form.Item name="contact_person_email" label="Email">
                    <Input placeholder="Enter email" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={6}>
                  <Form.Item name="contact_person_phone" label="Phone">
                    <Input placeholder="Enter phone" />
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
                {isEditMode ? "Update Manufacturer" : "Create Manufacturer"}
              </Button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default ManufacturerOnboardingForm;
