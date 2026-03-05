import React from "react";
import { Routes, Route } from "react-router";
import { Toaster } from "react-hot-toast";

import DynamicTemplateForm from "./components/DynamicTemplateForm";

function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<DynamicTemplateForm />} />
      </Routes>

      <Toaster />
    </div>
  );
}

export default App;
