import { Navigate, Outlet, Route, Routes } from "react-router";
import { Toaster } from "react-hot-toast";

import Header from "./components/Header";
import Footer from "./components/Footer";
import DynamicTemplateForm from "./components/DynamicTemplateForm";
import Dashboard from "./pages/Dashboard";
import Auth from "./auth/Auth";
import SignupCard from "./auth/components/SignupCard";
import LoginCard from "./auth/components/LoginCard";
import ForgotPasswordCard from "./auth/components/ForgotPasswordCard";
import EventDetails from "./pages/EventDetails";
import JudgeScore from "./pages/JudgeScore";
import ActivityLog from "./pages/ActivityLog";
import EventInfoTab from "./pages/event-details/EventInfoTab";
import JudgesTab from "./pages/event-details/JudgesTab";
import ContestantTab from "./pages/event-details/ContestantTab";
import ScoringTab from "./pages/event-details/ScoringTab";
import DisplayControlTab from "./pages/event-details/DisplayControlTab";

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
          <Route path="/" element={<DynamicTemplateForm />} />
          <Route path="/dashboard" element={<Dashboard />} />

          <Route path="/events/details" element={<EventDetails />}>
            <Route index element={<Navigate to="event-info" replace />} />
            <Route path="event-info" element={<EventInfoTab />} />
            <Route path="judges" element={<JudgesTab />} />
            <Route path="contestant" element={<ContestantTab />} />
            <Route path="scoring" element={<ScoringTab />} />
            <Route path="display-control" element={<DisplayControlTab />} />
          </Route>

          <Route path="/auth" element={<Auth />}>
            <Route index element={<Navigate to="login" replace />} />
            <Route path="login" element={<LoginCard />} />
            <Route path="signup" element={<SignupCard />} />
            <Route path="forgot-password" element={<ForgotPasswordCard />} />
          </Route>

          <Route path="/judge-score" element={<JudgeScore />} />
          <Route path="/activity-log" element={<ActivityLog />} />
        </Route>
      </Routes>
      <Toaster />
    </>
  );
}

export default App;
