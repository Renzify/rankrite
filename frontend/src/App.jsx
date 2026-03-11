import { Navigate, Outlet, Route, Routes } from "react-router";
import { Toaster } from "react-hot-toast";

import Header from "./components/Header";
import Footer from "./components/Footer";
import DynamicTemplateForm from "./pages/DynamicTemplateForm";
import Dashboard from "./pages/Dashboard";
import Auth from "./auth/Auth";
import SignupCard from "./auth/components/SignupCard";
import LoginCard from "./auth/components/LoginCard";
import ForgotPasswordCard from "./auth/components/ForgotPasswordCard";
import EventDetails from "./pages/EventDetails";
import JudgeScore from "./pages/JudgeScore";
import ActivityLog from "./pages/ActivityLog";
import Settings from "./pages/Settings";
import EventInfoTab from "./pages/event-details/EventInfoTab";
import ScoringTab from "./pages/event-details/ScoringTab";
import DisplayControlTab from "./pages/event-details/DisplayControlTab";
import DisplayView from "./pages/event-details/DisplayView";
import JudgesTab from "./components/JudgesTab";
import ContestantsTab from "./components/ContestantsTab";

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

function App() {
  return (
    <>
      <Routes>
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

          <Route path="/auth" element={<Auth />}>
            <Route index element={<Navigate to="login" replace />} />
            <Route path="login" element={<LoginCard />} />
            <Route path="signup" element={<SignupCard />} />
            <Route path="forgot-password" element={<ForgotPasswordCard />} />
          </Route>

          <Route path="/activity-log" element={<ActivityLog />} />
          <Route path="/settings" element={<Settings />} />
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
