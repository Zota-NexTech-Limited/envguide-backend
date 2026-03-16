import React from 'react';
import { Form, Input, Select, DatePicker, Button } from 'antd';
import {
  FileText,
  Building2,
  Calendar,
  Flag,
  ArrowRight,
  AlertCircle,
  Info,
  Save,
} from 'lucide-react';
import dayjs from 'dayjs';

const { TextArea } = Input;

interface BasicInformationStepProps {
  initialValues: any;
  onSave: (values: any) => void;
  onSaveAsDraft?: (values: any) => void;
}

// Priority to minimum days mapping
const PRIORITY_MIN_DAYS: Record<string, number> = {
  High: 10,
  Medium: 21,
  Low: 30,
};

const BasicInformationStep: React.FC<BasicInformationStepProps> = ({ initialValues, onSave, onSaveAsDraft }) => {
  const [form] = Form.useForm();

  // Watch for priority changes
  const selectedPriority = Form.useWatch('priority', form);

  // Calculate minimum due date based on priority
  const getMinDueDate = (priority: string | undefined) => {
    const minDays = priority ? PRIORITY_MIN_DAYS[priority] : 0;
    return dayjs().add(minDays, 'day').startOf('day');
  };

  const handleSave = () => {
    form.validateFields().then((values) => {
      onSave(values);
    });
  };

  const handleSaveAsDraft = () => {
    // Get current form values without validation for draft
    const values = form.getFieldsValue();
    onSaveAsDraft?.(values);
  };

  // Handle priority change - reset due date if it's before the new minimum
  const handlePriorityChange = (value: string) => {
    const currentDueDate = form.getFieldValue('dueDate');
    const minDate = getMinDueDate(value);

    // If current due date is before the new minimum, clear it
    if (currentDueDate && dayjs(currentDueDate).isBefore(minDate, 'day')) {
      form.setFieldValue('dueDate', null);
    }
  };

  const priorityOptions = [
    { label: 'High', value: 'High', color: 'text-red-600 bg-red-50', days: 10 },
    { label: 'Medium', value: 'Medium', color: 'text-orange-600 bg-orange-50', days: 21 },
    { label: 'Low', value: 'Low', color: 'text-green-600 bg-green-50', days: 30 },
  ];

  return (
    <div className="space-y-6">
      {/* Main Form Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Basic Information</h3>
              <p className="text-sm text-gray-500">Enter the details for your PCF request</p>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6">
          <Form
            form={form}
            layout="vertical"
            initialValues={initialValues}
            requiredMark={(label, { required }) => (
              <>
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
              </>
            )}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Request Title */}
              <div className="md:col-span-2">
                <Form.Item
                  label={
                    <span className="text-sm font-medium text-gray-700">Request Title</span>
                  }
                  name="title"
                  rules={[{ required: true, message: 'Please enter a request title' }]}
                >
                  <Input
                    placeholder="Enter a descriptive title for your request"
                    size="large"
                    className="!h-[40px] !rounded-lg"
                    prefix={<FileText className="w-4 h-4 text-gray-400 mr-2" />}
                  />
                </Form.Item>
              </div>

              {/* Priority */}
              <div>
                <Form.Item
                  label={
                    <span className="text-sm font-medium text-gray-700">Priority Level</span>
                  }
                  name="priority"
                  rules={[{ required: true, message: 'Please select a priority' }]}
                >
                  <Select
                    placeholder="Select Priority"
                    size="large"
                    className="w-full [&_.ant-select-selector]:!h-[40px] [&_.ant-select-selector]:!rounded-lg [&_.ant-select-selection-item]:!leading-[38px] [&_.ant-select-selection-placeholder]:!leading-[38px]"
                    optionLabelProp="label"
                    onChange={handlePriorityChange}
                  >
                    {priorityOptions.map((option) => (
                      <Select.Option key={option.value} value={option.value} label={option.label}>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            option.value === 'High' ? 'bg-red-500' :
                            option.value === 'Medium' ? 'bg-orange-500' : 'bg-green-500'
                          }`}></span>
                          <span>{option.label}</span>
                          <span className="text-xs text-gray-400">({option.days} days)</span>
                        </div>
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </div>

              {/* Due Date */}
              <div>
                <Form.Item
                  label={
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">Due Date</span>
                      {selectedPriority && (
                        <span className="text-xs text-gray-400">
                          (min: {getMinDueDate(selectedPriority).format('MMM DD, YYYY')})
                        </span>
                      )}
                    </div>
                  }
                  name="dueDate"
                  rules={[
                    { required: true, message: 'Please select a due date' },
                    {
                      validator: (_, value) => {
                        if (!selectedPriority) {
                          return Promise.reject(new Error('Please select priority first'));
                        }
                        const minDate = getMinDueDate(selectedPriority);
                        if (value && value.isBefore(minDate, 'day')) {
                          return Promise.reject(new Error(`Due date must be at least ${PRIORITY_MIN_DAYS[selectedPriority]} days from today`));
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <DatePicker
                    className="w-full !h-[40px] !rounded-lg"
                    placeholder={selectedPriority ? "Select due date" : "Select priority first"}
                    size="large"
                    format="MMM DD, YYYY"
                    suffixIcon={<Calendar className="w-4 h-4 text-gray-400" />}
                    disabled={!selectedPriority}
                    disabledDate={(current) => {
                      if (!current) return false;
                      const minDate = getMinDueDate(selectedPriority);
                      return current.isBefore(minDate, 'day');
                    }}
                  />
                </Form.Item>
              </div>

              {/* Organization */}
              <div className="md:col-span-2">
                <Form.Item
                  label={
                    <span className="text-sm font-medium text-gray-700">Requesting Organization</span>
                  }
                  name="organization"
                  rules={[{ required: true, message: 'Please enter organization name' }]}
                >
                  <Input
                    placeholder="Enter your organization name"
                    size="large"
                    className="!h-[40px] !rounded-lg"
                    prefix={<Building2 className="w-4 h-4 text-gray-400 mr-2" />}
                  />
                </Form.Item>
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <Form.Item
                  label={
                    <span className="text-sm font-medium text-gray-700">Request Description</span>
                  }
                  name="description"
                >
                  <TextArea
                    placeholder="Provide a detailed description of your PCF request, including any specific requirements or context..."
                    rows={4}
                    maxLength={500}
                    showCount
                    className="!rounded-lg"
                    style={{ resize: 'none' }}
                  />
                </Form.Item>
              </div>
            </div>
          </Form>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 rounded-2xl border border-blue-100 p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Info className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h4 className="font-medium text-blue-900 mb-1">What happens next?</h4>
            <p className="text-sm text-blue-700">
              After submitting basic information, you'll add product details, upload documentation, and review everything before final submission.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-500">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">All fields marked with * are required</span>
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

export default BasicInformationStep;
