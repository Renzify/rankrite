import { useEffect } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router";
import { Toaster } from "react-hot-toast";

import Header from "./layouts/Header";
import Footer from "./layouts/Footer";
import DynamicTemplateForm from "./pages/dynamic-template-form/DynamicTemplateForm";
import Dashboard from "./pages/dashboard/Dashboard";
import Auth from "./auth/Auth";
import SignupCard from "./auth/components/SignupCard";
import LoginCard from "./auth/components/LoginCard";
import ForgotPasswordCard from "./auth/components/ForgotPasswordCard";
import EventDetails from "./pages/event-details/EventDetails";
import JudgeScore from "./pages/judge-view/JudgeScore";
import ActivityLog from "./pages/activity-log/ActivityLog";
import EventInfoTab from "./pages/event-details/components/EventInfoTab";
import ScoringTab from "./pages/event-details/components/scoring-tab/ScoringTab";
import DisplayControlTab from "./pages/event-details/components/display-control-tab/DisplayControlTab";
import DisplayView from "./pages/DisplayView";
import JudgesTab from "./pages/event-details/components/judge-tab/JudgesTab";
import ContestantsTab from "./pages/event-details/components/contestant-tab/ContestantsTab";
import Settings from "./pages/settings/Settings";
import LandingPage from "./pages/LandingPage";
import { useAuthStore } from "./stores/authStore";

function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="app-page flex min-h-screen items-center justify-center">
      <span className="loading loading-spinner loading-lg text-primary" />
    </div>
  );
}

function ProtectedRoute() {
  const authUser = useAuthStore((state) => state.authUser);
  const isCheckingAuth = useAuthStore((state) => state.isCheckingAuth);

  if (isCheckingAuth) {
    return <LoadingScreen />;
  }

  if (!authUser) {
    return <Navigate to="/auth/login" replace />;
  }

  return <Outlet />;
}

function AuthOnlyRoute() {
  const authUser = useAuthStore((state) => state.authUser);
  const isCheckingAuth = useAuthStore((state) => state.isCheckingAuth);

  if (isCheckingAuth) {
    return <LoadingScreen />;
  }

  if (authUser) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Navigate to="/auth/login" replace />} />

        <Route element={<AuthOnlyRoute />}>
          <Route path="/auth" element={<Auth />}>
            <Route index element={<Navigate to="login" replace />} />
            <Route path="login" element={<LoginCard />} />
            <Route path="signup" element={<SignupCard />} />
            <Route path="forgot-password" element={<ForgotPasswordCard />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/event-form" element={<DynamicTemplateForm />} />
            <Route path="/dashboard" element={<Dashboard />} />

            <Route path="/events/:eventId" element={<EventDetails />}>
              <Route index element={<Navigate to="event-info" replace />} />
              <Route path="event-info" element={<EventInfoTab />} />
              <Route path="judges" element={<JudgesTab />} />
              <Route path="contestant" element={<ContestantsTab />} />
              <Route path="scoring" element={<ScoringTab />} />
              <Route path="display-control" element={<DisplayControlTab />} />
            </Route>

            <Route path="/activity-log" element={<ActivityLog />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>

        <Route path="/judge-score" element={<JudgeScore />} />
        <Route path="/judge/score" element={<JudgeScore />} />
        <Route path="/judge-scoring" element={<JudgeScore />} />
        <Route path="/live-display" element={<DisplayView />} />
      </Routes>
      <Toaster />
    </>
  );
}

export default App;
