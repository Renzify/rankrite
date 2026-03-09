import React from "react";
import { Routes, Route, Outlet } from "react-router";
import { Toaster } from "react-hot-toast";

import Header from "./components/Header";
import Footer from "./components/Footer";
import DynamicTemplateForm from "./components/DynamicTemplateForm";
import Dashboard from "./pages/Dashboard";

function AppLayout() {
  return (
    <div className="min-h-screen">
      <Header />
      <Footer />
      <main className="p-4">
        <Outlet />
      </main>
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
