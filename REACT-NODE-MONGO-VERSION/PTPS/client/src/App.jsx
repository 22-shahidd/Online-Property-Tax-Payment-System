import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth.js";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Layout from "./components/Layout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import ManageRates from "./pages/admin/ManageRates.jsx";
import Reports from "./pages/admin/Reports.jsx";
import ManageUsers from "./pages/admin/ManageUsers.jsx";
import AddOfficer from "./pages/admin/AddOfficer.jsx";

// Citizen pages
import CitizenDashboard from "./pages/citizen/CitizenDashboard.jsx";
import AddProperty from "./pages/citizen/AddProperty.jsx";
import PayTax from "./pages/citizen/PayTax.jsx";
import Grievances from "./pages/citizen/Grievances.jsx";

// Officer pages
import OfficerDashboard from "./pages/officer/OfficerDashboard.jsx";
import VerifyProperties from "./pages/officer/VerifyProperties.jsx";
import SearchProperties from "./pages/officer/SearchProperties.jsx";
import OfflinePayment from "./pages/officer/OfflinePayment.jsx";
import OfficerGrievances from "./pages/officer/OfficerGrievances.jsx";

function App() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />

      {/* Protected routes - wrapped in Layout */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* Admin routes */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/rates" element={<ManageRates />} />
        <Route path="/admin/reports" element={<Reports />} />
        <Route path="/admin/users" element={<ManageUsers />} />
        <Route path="/admin/officers" element={<AddOfficer />} />

        {/* Officer routes */}
        <Route path="/officer/dashboard" element={<OfficerDashboard />} />
        <Route path="/officer/verify" element={<VerifyProperties />} />
        <Route path="/officer/search" element={<SearchProperties />} />
        <Route path="/officer/payment" element={<OfflinePayment />} />
        <Route path="/officer/grievances" element={<OfficerGrievances />} />

        {/* Citizen routes */}
        <Route path="/citizen/dashboard" element={<CitizenDashboard />} />
        <Route path="/citizen/add-property" element={<AddProperty />} />
        <Route path="/citizen/pay-tax" element={<PayTax />} />
        <Route path="/citizen/grievances" element={<Grievances />} />
      </Route>

      {/* Default redirect based on role */}
      <Route
        path="/dashboard"
        element={
          user ? (
            <Navigate to={`/${user.role}/dashboard`} />
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
    </Routes>
  );
}

export default App;
