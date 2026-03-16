import React, { useState } from "react";
import {
  Form,
  Input,
  Button,
  Row,
  Col,
  message,
  Divider,
  Result,
} from "antd";
import { Factory, Save, CheckCircle } from "lucide-react";
import userManagementService from "../lib/userManagementService";

const { TextArea } = Input;

const PublicManufacturerOnboarding: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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

      const result = await userManagementService.createManufacturer(payload);

      if (result.success) {
        setSubmitted(true);
        message.success(result.message || "Registration submitted successfully!");
      } else {
        message.error(result.message || "Failed to submit registration");
      }
    } catch (error) {
      console.error("Error submitting registration:", error);
      message.error("An error occurred while submitting");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <Result
            icon={<CheckCircle className="w-16 h-16 text-green-500 mx-auto" />}
            status="success"
            title="Registration Submitted!"
            subTitle="Thank you for registering as a manufacturer. Our team will review your application and get back to you shortly."
            extra={[
              <Button
                type="primary"
                key="home"
                onClick={() => window.location.href = "/"}
                className="!bg-blue-600 hover:!bg-blue-700"
              >
                Go to Homepage
              </Button>,
            ]}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Factory className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Manufacturer Registration
              </h1>
              <p className="text-gray-500">
                Register your company as a manufacturer partner
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg">
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
            <div className="flex justify-center pt-6 border-t border-gray-100">
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                size="large"
                icon={<Save size={16} />}
                className="!bg-blue-600 hover:!bg-blue-700 !border-blue-600 shadow-lg shadow-blue-600/20 px-12"
              >
                Submit Registration
              </Button>
            </div>
          </Form>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm">
          <p>By submitting this form, you agree to our terms and conditions.</p>
        </div>
      </div>
    </div>
  );
};

export default PublicManufacturerOnboarding;
