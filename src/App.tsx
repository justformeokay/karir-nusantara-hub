import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { AdminLayout } from "./components/layout/AdminLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Companies from "./pages/Companies";
import JobSeekers from "./pages/JobSeekers";
import JobManagement from "./pages/JobManagement";
import JobReports from "./pages/JobReports";
import Support from "./pages/Support";
import Notifications from "./pages/Notifications";
import Billing from "./pages/Billing";
import ReferralPartners from "./pages/ReferralPartners";
import ReferredCompanies from "./pages/ReferredCompanies";
import CommissionPayouts from "./pages/CommissionPayouts";
import DebugLogs from "./pages/DebugLogs";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <AdminLayout>
                  <Dashboard />
                </AdminLayout>
              }
            />
            <Route
              path="/companies"
              element={
                <AdminLayout>
                  <Companies />
                </AdminLayout>
              }
            />
            <Route
              path="/job-seekers"
              element={
                <AdminLayout>
                  <JobSeekers />
                </AdminLayout>
              }
            />
            <Route
              path="/jobs"
              element={
                <AdminLayout>
                  <JobManagement />
                </AdminLayout>
              }
            />
            <Route
              path="/support"
              element={
                <AdminLayout>
                  <Support />
                </AdminLayout>
              }
            />
            <Route
              path="/job-reports"
              element={
                <AdminLayout>
                  <JobReports />
                </AdminLayout>
              }
            />
            <Route
              path="/notifications"
              element={
                <AdminLayout>
                  <Notifications />
                </AdminLayout>
              }
            />
            <Route
              path="/billing"
              element={
                <AdminLayout>
                  <Billing />
                </AdminLayout>
              }
            />
            {/* Referral & Affiliate Routes */}
            <Route
              path="/referral/partners"
              element={
                <AdminLayout>
                  <ReferralPartners />
                </AdminLayout>
              }
            />
            <Route
              path="/referral/companies"
              element={
                <AdminLayout>
                  <ReferredCompanies />
                </AdminLayout>
              }
            />
            <Route
              path="/referral/payouts"
              element={
                <AdminLayout>
                  <CommissionPayouts />
                </AdminLayout>
              }
            />
            <Route path="/debug-logs" element={<DebugLogs />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
