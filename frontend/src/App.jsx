import { Routes, Route, Outlet } from "react-router";
import { Toaster } from "react-hot-toast";

import Header from "./components/Header";
import Footer from "./components/Footer";
import DynamicTemplateForm from "./components/DynamicTemplateForm";
import Dashboard from "./pages/Dashboard";

function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 p-4">
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
        </Route>
      </Routes>
      <Toaster />
    </>
  );
}

export default App;
