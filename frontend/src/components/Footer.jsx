import React from "react";

function Footer() {
  return (
    <footer className="border border-base-300 bg-base-100/95 p-6 shadow-sm mt-auto">
      <div className="w-full max-w-6/7 mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-sm text-base-content/70">
          © Rankrite {new Date().getFullYear()}
        </div>
      </div>
    </footer>
  );
}

export default Footer;
