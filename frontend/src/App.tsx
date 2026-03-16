import { RouterProvider } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import { router } from './routes';
import { AuthProvider } from './contexts/AuthContext';
import { PermissionProvider } from './contexts/PermissionContext';

// Green accent theme configuration for Ant Design
const themeConfig = {
  token: {
    // Primary colors - Green accent
    colorPrimary: '#16a34a',
    colorPrimaryHover: '#15803d',
    colorPrimaryActive: '#166534',
    colorPrimaryBg: '#f0fdf4',
    colorPrimaryBgHover: '#dcfce7',
    colorPrimaryBorder: '#86efac',
    colorPrimaryBorderHover: '#4ade80',
    colorPrimaryText: '#16a34a',
    colorPrimaryTextHover: '#15803d',
    colorPrimaryTextActive: '#166534',

    // Success colors
    colorSuccess: '#16a34a',
    colorSuccessBg: '#f0fdf4',
    colorSuccessBorder: '#86efac',

    // Border radius
    borderRadius: 12,
    borderRadiusLG: 16,
    borderRadiusSM: 8,

    // Fonts
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',

    // Colors
    colorBgContainer: '#ffffff',
    colorBgLayout: '#f8fafc',
    colorBorder: '#e2e8f0',
    colorBorderSecondary: '#f1f5f9',
  },
  components: {
    Button: {
      borderRadius: 10,
      controlHeight: 40,
      controlHeightLG: 48,
      controlHeightSM: 32,
      primaryShadow: '0 4px 14px 0 rgba(22, 163, 74, 0.25)',
    },
    Card: {
      borderRadiusLG: 16,
      boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    },
    Input: {
      borderRadius: 10,
      controlHeight: 40,
      controlHeightLG: 48,
      activeBorderColor: '#16a34a',
      hoverBorderColor: '#16a34a',
    },
    Select: {
      borderRadius: 10,
      controlHeight: 40,
      controlHeightLG: 48,
    },
    Table: {
      borderRadius: 12,
      headerBg: '#f8fafc',
      headerColor: '#475569',
    },
    Modal: {
      borderRadiusLG: 16,
    },
    Drawer: {
      borderRadiusLG: 16,
    },
    Tabs: {
      inkBarColor: '#16a34a',
      itemActiveColor: '#16a34a',
      itemHoverColor: '#15803d',
      itemSelectedColor: '#16a34a',
    },
    Steps: {
      colorPrimary: '#16a34a',
    },
    Tag: {
      borderRadiusSM: 6,
    },
    Message: {
      borderRadiusLG: 12,
    },
    Notification: {
      borderRadiusLG: 12,
    },
  },
};

function App() {
  return (
    <ConfigProvider theme={themeConfig}>
      <AntApp>
        <AuthProvider>
          <PermissionProvider>
            <RouterProvider router={router} />
          </PermissionProvider>
        </AuthProvider>
      </AntApp>
    </ConfigProvider>
  );
}

export default App;
