import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Select,
  Row,
  Col,
  message,
  Divider,
  Result,
} from "antd";
import { Truck, Save, CheckCircle } from "lucide-react";
import userManagementService from "../lib/userManagementService";
import { getDropdownList } from "../lib/masterDataSetupService";

const { Option } = Select;
const { TextArea } = Input;

const PublicSupplierOnboarding: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [businessTypeOptions, setBusinessTypeOptions] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const loadBusinessTypeOptions = async () => {
      const options = await getDropdownList("supplier-tier");
      setBusinessTypeOptions(options);
    };
    loadBusinessTypeOptions();
  }, []);

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

      const result = await userManagementService.createSupplier(payload);

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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <Result
            icon={<CheckCircle className="w-16 h-16 text-green-500 mx-auto" />}
            status="success"
            title="Registration Submitted!"
            subTitle="Thank you for registering as a supplier. Our team will review your application and get back to you shortly."
            extra={[
              <Button
                type="primary"
                key="home"
                onClick={() => window.location.href = "/"}
                className="!bg-purple-600 hover:!bg-purple-700"
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Truck className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Supplier Registration
              </h1>
              <p className="text-gray-500">
                Register your company as a supplier partner
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
                loading={loading}
                size="large"
                icon={<Save size={16} />}
                className="!bg-purple-600 hover:!bg-purple-700 !border-purple-600 shadow-lg shadow-purple-600/20 px-12"
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

export default PublicSupplierOnboarding;
