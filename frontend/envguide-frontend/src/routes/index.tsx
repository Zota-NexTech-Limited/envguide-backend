import { createBrowserRouter, Navigate } from "react-router-dom";
import Layout from "../components/Layout";
import Dashboard from "../pages/Dashboard";
import VisitorManagement from "../pages/VisitorManagement";
import SuiteManagement from "../pages/SuiteManagement";
import Bookings from "../pages/Bookings";
import HardwareManagement from "../pages/HardwareManagement";
import DocumentsManagement from "../pages/DocumentsManagement";
import Settings from "../pages/Settings";
import Login from "../pages/auth/Login";
import Signup from "../pages/auth/Signup";
import ForgotPassword from "../pages/auth/ForgotPassword";
import ResetPassword from "../pages/auth/ResetPassword";
import ForgotMFA from "../pages/auth/ForgotMFA";
import MFAVerification from "../pages/auth/MFAVerification";
import Users from "../pages/settings/Users";
import UsersCreate from "../pages/settings/UsersCreate";
import UsersEdit from "../pages/settings/UsersEdit";
import Authorizations from "../pages/settings/Authorizations";
import AlertManagement from "../pages/settings/AlertManagement";
import AlertManagementCreate from "../pages/settings/AlertManagementCreate";
import ManufacturerOnboardingForm from "../pages/settings/ManufacturerOnboardingForm";
import SupplierOnboardingForm from "../pages/settings/SupplierOnboardingForm";
import PublicManufacturerOnboarding from "../pages/PublicManufacturerOnboarding";
import PublicSupplierOnboarding from "../pages/PublicSupplierOnboarding";
import Products from "../pages/settings/Products";
import Components from "../pages/settings/Components";
import DataSetup from "../pages/settings/DataSetup";
import DataSetupTabs from "../pages/settings/DataSetupTabs";
import MasterDataSetupTabs from "../pages/settings/MasterDataSetupTabs";
import EcoInventSetupTabs from "../pages/settings/EcoInventSetupTabs";
import {
  dataSetupGroups,
  masterDataSetupGroups,
  ecoInventSetupGroups,
} from "../config/dataSetupGroups";
import ProtectedRoute from "../components/ProtectedRoute";
import PermissionRoute from "../components/PermissionRoute";

// New pages
import PCFRequest from "../pages/PCFRequest";
import ProductPortfolio from "../pages/ProductPortfolio";
import AllProducts from "../pages/AllProducts";
import ProductCreate from "../pages/ProductCreate";
import ProductView from "../pages/ProductView";
import ProductEdit from "../pages/ProductEdit";
import ComponentsMaster from "../pages/ComponentsMaster";
import ComponentsMasterView from "../pages/ComponentsMasterView";
import DocumentMaster from "../pages/DocumentMaster";
import TaskManagement from "../pages/TaskManagement";
import TaskCreate from "../pages/TaskCreate";
import ReportsMain from "../pages/Reports";
import SupplierQuestionnaire from "../pages/SupplierQuestionnaire";
import SupplierQuestionnaireList from "../pages/SupplierQuestionnaireList";
import DataQualityRating from "../pages/DataQualityRating";
import DataQualityRatingList from "../pages/DataQualityRatingList";
import PCFRequestCreate from "../pages/PCFRequestCreate";
import PCFRequestView from "../pages/PCFRequestView";
import PCFRequestEdit from "../pages/PCFRequestEdit";
import TaskView from "../pages/TaskView";
import ReportView from "../pages/ReportView";

// Detailed Dashboard Pages
import DetailedLifeCycle from "../pages/DetailedLifeCycle";
import DetailedSupplierEmission from "../pages/DetailedSupplierEmission";
import DetailedRawMaterialEmission from "../pages/DetailedRawMaterialEmission";
import DetailedPackagingEmission from "../pages/DetailedPackagingEmission";
import DetailedTransportationEmission from "../pages/DetailedTransportationEmission";
import DetailedEnergyEmission from "../pages/DetailedEnergyEmission";
import DetailedRecyclability from "../pages/DetailedRecyclability";
import DetailedWasteEmission from "../pages/DetailedWasteEmission";
import DetailedImpactCategories from "../pages/DetailedImpactCategories";
import DetailedPCFTrend from "../pages/DetailedPCFTrend";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/signup",
    element: <Signup />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPassword />,
  },
  {
    path: "/reset-password",
    element: <ResetPassword />,
  },
  {
    path: "/forgot-mfa",
    element: <ForgotMFA />,
  },
  {
    path: "/mfa-verification",
    element: <MFAVerification />,
  },
  // Public supplier questionnaire route (no login required when accessed via link with sup_id and bom_pcf_id)
  {
    path: "/supplier-questionnaire",
    element: <SupplierQuestionnaire />,
  },
  // Public manufacturer onboarding form (no login required)
  {
    path: "/manufacturer-onboarding",
    element: <PublicManufacturerOnboarding />,
  },
  // Public supplier onboarding form (no login required)
  {
    path: "/supplier-onboarding",
    element: <PublicSupplierOnboarding />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: "dashboard",
        element: <Dashboard />,
      },
      {
        path: "dashboard/detailed-lifecycle",
        element: <DetailedLifeCycle />,
      },
      {
        path: "dashboard/detailed-supplier",
        element: <DetailedSupplierEmission />,
      },
      {
        path: "dashboard/detailed-raw-material",
        element: <DetailedRawMaterialEmission />,
      },
      {
        path: "dashboard/detailed-packaging",
        element: <DetailedPackagingEmission />,
      },
      {
        path: "dashboard/detailed-transportation",
        element: <DetailedTransportationEmission />,
      },
      {
        path: "dashboard/detailed-energy",
        element: <DetailedEnergyEmission />,
      },
      {
        path: "dashboard/detailed-recyclability",
        element: <DetailedRecyclability />,
      },
      {
        path: "dashboard/detailed-waste",
        element: <DetailedWasteEmission />,
      },
      {
        path: "dashboard/detailed-impact",
        element: <DetailedImpactCategories />,
      },
      {
        path: "dashboard/detailed-pcf-trend",
        element: <DetailedPCFTrend />,
      },
      {
        path: "pcf-request",
        element: (
          <PermissionRoute permissionKey="pcf request">
            <PCFRequest />
          </PermissionRoute>
        ),
      },
      {
        path: "pcf-request/new",
        element: (
          <PermissionRoute permissionKey="pcf request" action="create">
            <PCFRequestCreate />
          </PermissionRoute>
        ),
      },
      {
        path: "pcf-request/:id",
        element: (
          <PermissionRoute permissionKey="pcf request">
            <PCFRequestView />
          </PermissionRoute>
        ),
      },
      {
        path: "pcf-request/:id/edit",
        element: (
          <PermissionRoute permissionKey="pcf request" action="update">
            <PCFRequestEdit />
          </PermissionRoute>
        ),
      },
      {
        path: "product-portfolio",
        element: (
          <PermissionRoute permissionKey="product portfolio">
            <AllProducts />
          </PermissionRoute>
        ),
      },
      {
        path: "product-portfolio/all-products",
        element: (
          <PermissionRoute permissionKey="product portfolio">
            <AllProducts />
          </PermissionRoute>
        ),
      },
      {
        path: "product-portfolio/new",
        element: (
          <PermissionRoute permissionKey="product portfolio" action="create">
            <ProductCreate />
          </PermissionRoute>
        ),
      },
      {
        path: "product-portfolio/view/:id",
        element: (
          <PermissionRoute permissionKey="product portfolio">
            <ProductView />
          </PermissionRoute>
        ),
      },
      {
        path: "product-portfolio/edit/:id",
        element: (
          <PermissionRoute permissionKey="product portfolio" action="update">
            <ProductEdit />
          </PermissionRoute>
        ),
      },
      {
        path: "components-master",
        element: (
          <PermissionRoute permissionKey="component master">
            <ComponentsMaster />
          </PermissionRoute>
        ),
      },
      {
        path: "components-master/view/:id",
        element: (
          <PermissionRoute permissionKey="component master">
            <ComponentsMasterView />
          </PermissionRoute>
        ),
      },
      {
        path: "document-master",
        element: (
          <PermissionRoute permissionKey="document master">
            <DocumentMaster />
          </PermissionRoute>
        ),
      },
      {
        path: "task-management",
        element: (
          <PermissionRoute permissionKey="task management">
            <TaskManagement />
          </PermissionRoute>
        ),
      },
      {
        path: "task-management/new",
        element: (
          <PermissionRoute permissionKey="task management" action="create">
            <TaskCreate />
          </PermissionRoute>
        ),
      },
      {
        path: "task-management/view/:id",
        element: (
          <PermissionRoute permissionKey="task management">
            <TaskView />
          </PermissionRoute>
        ),
      },
      {
        path: "reports",
        element: (
          <PermissionRoute permissionKey="reports">
            <ReportsMain />
          </PermissionRoute>
        ),
      },
      {
        path: "reports/:id",
        element: (
          <PermissionRoute permissionKey="reports">
            <ReportView />
          </PermissionRoute>
        ),
      },
      {
        path: "visitor-management",
        element: <VisitorManagement />,
      },
      {
        path: "suite-management",
        element: <SuiteManagement />,
      },
      {
        path: "bookings",
        element: <Bookings />,
      },
      {
        path: "hardware-management",
        element: <HardwareManagement />,
      },
      {
        path: "documents-management",
        element: <DocumentsManagement />,
      },
      {
        path: "settings",
        element: (
          <PermissionRoute permissionKey="settings">
            <Settings />
          </PermissionRoute>
        ),
      },
      {
        path: "settings/users",
        element: (
          <PermissionRoute permissionKey="manage users">
            <Users />
          </PermissionRoute>
        ),
      },
      {
        path: "settings/users/create",
        element: (
          <PermissionRoute permissionKey="create new user" action="create">
            <UsersCreate />
          </PermissionRoute>
        ),
      },
      {
        path: "settings/users/edit/:userId",
        element: (
          <PermissionRoute permissionKey="manage users" action="update">
            <UsersEdit />
          </PermissionRoute>
        ),
      },
      {
        path: "settings/manufacturer-onboarding",
        element: (
          <PermissionRoute permissionKey="settings">
            <ManufacturerOnboardingForm />
          </PermissionRoute>
        ),
      },
      {
        path: "settings/manufacturer-onboarding/:id",
        element: (
          <PermissionRoute permissionKey="settings">
            <ManufacturerOnboardingForm />
          </PermissionRoute>
        ),
      },
      {
        path: "settings/supplier-onboarding",
        element: (
          <PermissionRoute permissionKey="settings">
            <SupplierOnboardingForm />
          </PermissionRoute>
        ),
      },
      {
        path: "settings/supplier-onboarding/:id",
        element: (
          <PermissionRoute permissionKey="settings">
            <SupplierOnboardingForm />
          </PermissionRoute>
        ),
      },
      {
        path: "settings/authorizations",
        element: (
          <PermissionRoute permissionKey="authorization">
            <Authorizations />
          </PermissionRoute>
        ),
      },
      {
        path: "settings/alert-management",
        element: (
          <PermissionRoute permissionKey="alert management">
            <AlertManagement />
          </PermissionRoute>
        ),
      },
      {
        path: "settings/alert-management/new",
        element: (
          <PermissionRoute permissionKey="alert management" action="create">
            <AlertManagementCreate />
          </PermissionRoute>
        ),
      },
      {
        path: "settings/alert-management/edit/:id",
        element: (
          <PermissionRoute permissionKey="alert management" action="update">
            <AlertManagementCreate />
          </PermissionRoute>
        ),
      },
      {
        path: "settings/products/:tab?",
        element: (
          <PermissionRoute permissionKey="data configuration">
            <Products />
          </PermissionRoute>
        ),
      },
      {
        path: "settings/components/:tab?",
        element: (
          <PermissionRoute permissionKey="data configuration">
            <Components />
          </PermissionRoute>
        ),
      },
      // All data setup pages (single entity or grouped with tabs)
      {
        path: "settings/data-setup/:entity",
        element: (
          <PermissionRoute permissionKey="data configuration">
            <DataSetup />
          </PermissionRoute>
        ),
      },
      // Tabbed data setup pages (uses /api/data-setup)
      ...dataSetupGroups.map((group) => ({
        path: `settings/data-setup/${group.key}/:tab?`,
        element: (
          <PermissionRoute permissionKey="data configuration">
            <DataSetupTabs
              title={group.title}
              description={group.description}
              tabs={group.tabs}
              defaultTab={group.tabs[0]?.key || ""}
            />
          </PermissionRoute>
        ),
      })),
      // Master Data Setup pages (uses /api/master-data-setup)
      ...masterDataSetupGroups.map((group) => ({
        path: `settings/master-data-setup/${group.key}/:tab?`,
        element: (
          <PermissionRoute permissionKey="master data setup">
            <MasterDataSetupTabs
              title={group.title}
              description={group.description}
              tabs={group.tabs}
              defaultTab={group.tabs[0]?.key || ""}
            />
          </PermissionRoute>
        ),
      })),
      // ECOInvent Emission Factor pages (uses /api/ecoinvent-emission-factor-data-setup)
      ...ecoInventSetupGroups.map((group) => ({
        path: `settings/ecoinvent-setup/${group.key}/:tab?`,
        element: (
          <PermissionRoute permissionKey="eco invent emission factors">
            <EcoInventSetupTabs
              title={group.title}
              description={group.description}
              tabs={group.tabs}
              defaultTab={group.tabs[0]?.key || ""}
            />
          </PermissionRoute>
        ),
      })),
      {
        path: "data-quality-rating",
        element: (
          <PermissionRoute permissionKey="data quality rating">
            <DataQualityRatingList />
          </PermissionRoute>
        ),
      },
      {
        path: "data-quality-rating/view",
        element: (
          <PermissionRoute permissionKey="data quality rating">
            <DataQualityRating />
          </PermissionRoute>
        ),
      },
    ],
  },
]);
