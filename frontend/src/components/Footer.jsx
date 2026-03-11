import React from "react";

function Footer() {
  return (
    <footer className="rounded-2xl border border-base-300 bg-base-100/95 p-6 shadow-sm mt-auto">
      <div className="w-full max-w-6/7 mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-sm text-base-content/70">© Rankrite 2026</div>
        <div className="flex gap-6 text-sm">
          <a
            href="/privacy"
            className="link link-hover text-base-content/70 hover:text-primary"
          >
            Privacy Policy
          </a>
          <span className="text-base-content/30">|</span>
          <a
            href="/terms"
            className="link link-hover text-base-content/70 hover:text-primary"
          >
            Terms of Service
          </a>
          <span className="text-base-content/30">|</span>
          <a
            href="/help"
            className="link link-hover text-base-content/70 hover:text-primary"
          >
            Help Center
          </a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
