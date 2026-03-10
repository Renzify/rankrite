import { Navigate, Outlet, Route, Routes } from "react-router";
import { Toaster } from "react-hot-toast";

import Header from "./components/Header";
import Footer from "./components/Footer";
import DynamicTemplateForm from "./components/DynamicTemplateForm";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import EventDetails from "./pages/EventDetails";
import JudgeScore from "./pages/JudgeScore";
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

          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/judge-score" element={<JudgeScore />} />
        </Route>
      </Routes>
      <Toaster />
    </>
  );
}

export default App;
