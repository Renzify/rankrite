import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Menu, X } from "lucide-react";
import toast from "react-hot-toast";
import { DropdownMenu } from "./helpers/Dropdown";
import { useAuthStore } from "../stores/authStore";

import logo from "../assets/images/rankrite-logo-1.png";

function Header2() {
  const navigate = useNavigate();
  const location = useLocation();
  const authUser = useAuthStore((state) => state.authUser);
  const logout = useAuthStore((state) => state.logout);
  const isLoggingOut = useAuthStore((state) => state.isLoggingOut);

  const headerRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHeaderStuck, setIsHeaderStuck] = useState(false);

  const isLandingPage = location.pathname === "/";
  const navItems = [
    ...(authUser
      ? [{ label: "Dashboard", type: "route", value: "/dashboard" }]
      : []),
    { label: "Features", type: "anchor", value: "#features" },
    { label: "Pricing", type: "anchor", value: "#pricing" },
  ];

  const closeAllDropdowns = useCallback(() => {
    profileDropdownRef.current?.close();
  }, []);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  const closeAllMenus = useCallback(() => {
    closeAllDropdowns();
    closeMobileMenu();
  }, [closeAllDropdowns, closeMobileMenu]);

  const handleRouteNavigation = useCallback(
    (path) => {
      closeAllMenus();
      navigate(path);
    },
    [closeAllMenus, navigate],
  );

  const handleToggleMobileMenu = useCallback(() => {
    closeAllDropdowns();
    setIsMobileMenuOpen((prev) => !prev);
  }, [closeAllDropdowns]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      handleRouteNavigation("/auth/login");
    } catch (error) {
      const message =
        error?.response?.data?.message ?? "Failed to log out. Please try again.";
      toast.error(message);
    }
  }, [logout, handleRouteNavigation]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!headerRef.current?.contains(event.target)) {
        closeAllMenus();
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        closeAllMenus();
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
  }, [closeAllMenus, closeMobileMenu]);

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
      const isActive = location.pathname.startsWith(item.value);

      return (
        <button
          key={item.label}
          type="button"
          className={`${baseClasses} ${stateClasses} ${isActive ? "text-[#f59a23]" : ""}`}
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
        onClick={closeAllMenus}
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

          <div className="hidden flex-1 items-center justify-center gap-4 lg:flex xl:gap-8">
            {isLandingPage
              ? navItems.map((item) => renderNavItem(item))
              : null}
          </div>

          <div className="hidden shrink-0 items-center gap-2 lg:flex">
            {authUser ? (
              <DropdownMenu
                ref={profileDropdownRef}
                menuClassName="menu mt-2 w-48 rounded-box border border-slate-200 bg-white p-1 shadow-lg"
                trigger={({ toggle }) => (
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    onClick={() => {
                      toggle();
                      closeMobileMenu();
                    }}
                  >
                    <div className="avatar placeholder">
                      <div className="w-8 rounded-full bg-slate-900 text-white" />
                    </div>
                    <span>{authUser?.fullName || "Admin"}</span>
                  </button>
                )}
              >
                <ul>
                  <li>
                    <button
                      type="button"
                      onClick={() => handleRouteNavigation("/dashboard")}
                    >
                      Dashboard
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => handleRouteNavigation("/settings")}
                    >
                      Settings
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => handleRouteNavigation("/activity-log")}
                    >
                      Activity Log
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      disabled={isLoggingOut}
                      className="text-error hover:bg-error hover:text-error-content"
                      onClick={handleLogout}
                    >
                      {isLoggingOut ? "Logging out..." : "Log out"}
                    </button>
                  </li>
                </ul>
              </DropdownMenu>
            ) : (
              <>
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
              </>
            )}
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
            {isLandingPage ? (
              <nav className="flex flex-col gap-1.5">
                {navItems.map((item) => renderNavItem(item, true))}
              </nav>
            ) : null}

            <div
              className={`flex flex-col gap-3 ${isLandingPage ? "mt-4 border-t border-slate-100 pt-4" : ""}`}
            >
              {authUser ? (
                <>
                  <button
                    type="button"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    onClick={() => handleRouteNavigation("/dashboard")}
                  >
                    Dashboard
                  </button>
                  <button
                    type="button"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    onClick={() => handleRouteNavigation("/settings")}
                  >
                    Settings
                  </button>
                  <button
                    type="button"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    onClick={() => handleRouteNavigation("/activity-log")}
                  >
                    Activity Log
                  </button>
                  <button
                    type="button"
                    disabled={isLoggingOut}
                    className="w-full rounded-2xl border border-error/40 px-4 py-3 text-sm font-medium text-error transition hover:bg-error hover:text-error-content"
                    onClick={handleLogout}
                  >
                    {isLoggingOut ? "Logging out..." : "Log out"}
                  </button>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-sm font-semibold text-slate-800">
                      {authUser?.fullName || "Admin"}
                    </p>
                    <p className="text-xs text-slate-500">Signed in</p>
                  </div>
                </>
              ) : (
                <>
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
                </>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}

export default Header2;
