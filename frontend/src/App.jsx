import React from "react";
import { NavLink, Route, Routes } from "react-router";
import { Toaster } from "react-hot-toast";

import DynamicTemplateForm from "./components/DynamicTemplateForm";
import TemplateBuilderForm from "./components/TemplateBuilderForm";

function App() {
  return (
    <div className="min-h-screen bg-slate-100">
      <div className="navbar border-b border-base-300 bg-base-100/90 px-4">
        <div className="flex-1">
          <p className="text-lg font-semibold">Rankrite</p>
        </div>
        <div className="flex gap-2">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `btn btn-sm ${isActive ? "btn-primary" : "btn-ghost"}`
            }
          >
            Dynamic Form
          </NavLink>
          <NavLink
            to="/builder"
            className={({ isActive }) =>
              `btn btn-sm ${isActive ? "btn-primary" : "btn-ghost"}`
            }
          >
            Template Builder
          </NavLink>
        </div>
      </div>

      <Routes>
        <Route path="/" element={<DynamicTemplateForm />} />
        <Route path="/builder" element={<TemplateBuilderForm />} />
      </Routes>

      <Toaster />
    </div>
  );
}

export default App;
