import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Menu, X } from "lucide-react";

import logo from "../assets/images/rankrite-logo-1.png";

const navItems = [
  { label: "Dashboard", type: "route", value: "/dashboard" },
  { label: "Features", type: "anchor", value: "#features" },
  { label: "Pricing", type: "anchor", value: "#pricing" },
  { label: "Documentation", type: "anchor", value: "#documentation" },
];

function Header2() {
  const navigate = useNavigate();
  const headerRef = useRef(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHeaderStuck, setIsHeaderStuck] = useState(false);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  const handleRouteNavigation = useCallback(
    (path) => {
      closeMobileMenu();
      navigate(path);
    },
    [closeMobileMenu, navigate],
  );

  const handleToggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!headerRef.current?.contains(event.target)) {
        closeMobileMenu();
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        closeMobileMenu();
      }
    };

    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        closeMobileMenu();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", handleResize);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", handleResize);
    };
  }, [closeMobileMenu]);

  useEffect(() => {
    const handleScroll = () => {
      setIsHeaderStuck(window.scrollY > 20);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const renderNavItem = (item, mobile = false) => {
    const baseClasses = mobile
      ? "w-full rounded-2xl px-4 py-3 text-left text-sm font-medium transition"
      : "rounded-full px-3 py-2 text-[15px] font-medium transition";
    const stateClasses = mobile
      ? "text-slate-500 hover:bg-orange-50 hover:text-[#f59a23]"
      : "text-slate-400 hover:text-[#f59a23]";

    if (item.type === "route") {
      return (
        <button
          key={item.label}
          type="button"
          className={`${baseClasses} ${stateClasses}`}
          onClick={() => handleRouteNavigation(item.value)}
        >
          {item.label}
        </button>
      );
    }

    return (
      <a
        key={item.label}
        href={item.value}
        className={`${baseClasses} ${stateClasses} block`}
        onClick={closeMobileMenu}
      >
        {item.label}
      </a>
    );
  };

  return (
    <header
      ref={headerRef}
      className={`z-40 flex justify-center border border-base-300 bg-base-100/95 px-4 backdrop-blur transition-shadow duration-300 sticky top-0 ${
        isHeaderStuck
          ? "landing-navbar-stuck shadow-[0_16px_35px_-28px_rgba(31,26,22,0.75)]"
          : "shadow-sm"
      }`}
    >
      <div className="w-full max-w-[1240px] py-4">
        <div className="flex items-center justify-between gap-4 lg:gap-8">
          <button
            type="button"
            className="relative flex shrink-0 items-center"
            onClick={() => handleRouteNavigation("/")}
          >
            <span
              aria-hidden="true"
              className="absolute -inset-x-4 -inset-y-3 rounded-full bg-[radial-gradient(circle,_rgba(245,154,35,0.22)_0%,_rgba(245,154,35,0.08)_40%,_transparent_74%)] blur-xl"
            />
            <img
              src={logo}
              alt="Rankrite"
              className="relative h-10 w-auto sm:h-11"
            />
          </button>

          <nav className="hidden flex-1 items-center justify-center gap-4 lg:flex xl:gap-8">
            {navItems.map((item) => renderNavItem(item))}
          </nav>

          <div className="hidden shrink-0 items-center gap-2 lg:flex">
            <button
              type="button"
              className="rounded-full px-4 py-2.5 text-sm font-medium text-slate-500 transition hover:text-slate-900"
              onClick={() => handleRouteNavigation("/auth/login")}
            >
              Log in
            </button>
            <button
              type="button"
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-[0_14px_30px_-22px_rgba(15,23,42,0.95)] transition hover:bg-slate-800"
              onClick={() => handleRouteNavigation("/auth/signup")}
            >
              Get Started
            </button>
          </div>

          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-700 transition hover:bg-slate-50 lg:hidden"
            aria-controls="landing-mobile-menu"
            aria-expanded={isMobileMenuOpen}
            aria-label={
              isMobileMenuOpen
                ? "Close navigation menu"
                : "Open navigation menu"
            }
            onClick={handleToggleMobileMenu}
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {isMobileMenuOpen ? (
          <div
            id="landing-mobile-menu"
            className="mt-4 rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_24px_50px_-28px_rgba(15,23,42,0.4)] lg:hidden"
          >
            <nav className="flex flex-col gap-1.5">
              {navItems.map((item) => renderNavItem(item, true))}
            </nav>

            <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                onClick={() => handleRouteNavigation("/auth/login")}
              >
                Log in
              </button>
              <button
                type="button"
                className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
                onClick={() => handleRouteNavigation("/auth/signup")}
              >
                Get Started
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}

export default Header2;
