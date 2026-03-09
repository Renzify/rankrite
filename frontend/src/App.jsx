import React from "react";
import { Route, Routes } from "react-router";
import { Toaster } from "react-hot-toast";

import DynamicTemplateForm from "./components/DynamicTemplateForm";
import TemplateBuilderForm from "./components/TemplateBuilderForm";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";

function App() {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Navbar />

      <div className="flex-grow">
        <Routes>
          <Route path="/" element={<DynamicTemplateForm />} />
          <Route path="/builder" element={<TemplateBuilderForm />} />
        </Routes>
      </div>

      <Toaster />
      <Footer />
    </div>
  );
}

export default App;
