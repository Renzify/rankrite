import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Menu, X } from "lucide-react";
import { DropdownMenu } from "./helpers/Dropdown";
import toast from "react-hot-toast";
import { useAuthStore } from "../stores/authStore";

function Header() {
  const navigate = useNavigate();
  const authUser = useAuthStore((state) => state.authUser);
  const logout = useAuthStore((state) => state.logout);
  const isLoggingOut = useAuthStore((state) => state.isLoggingOut);

  const headerRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeAllDropdowns = useCallback(() => {
    profileDropdownRef.current?.close();
  }, []);

  const closeAllMenus = useCallback(() => {
    closeAllDropdowns();
    setIsMobileMenuOpen(false);
  }, [closeAllDropdowns]);

  const navigateTo = useCallback(
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
      navigateTo("/auth/login");
    } catch (error) {
      const message =
        error?.response?.data?.message ?? "Failed to log out. Please try again.";
      toast.error(message);
    }
  }, [logout, navigateTo]);

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
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
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
  }, [closeAllMenus]);

  return (
    <header
      ref={headerRef}
      className="navbar flex justify-center border border-base-300 bg-base-100/95 px-4 shadow-sm"
    >
      <div className="flex w-full max-w-6/7 flex-col py-3">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            className="flex items-center gap-3 text-left"
            onClick={() => navigateTo("/dashboard")}
          >
            <img
              src="/src/assets/images/rankrite-logo-1.png"
              alt="Rankrite"
              className="h-10 w-auto"
            />
          </button>

          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              className="btn btn-ghost hidden md:inline-flex"
              onClick={() => navigateTo("/dashboard")}
            >
              Home
            </button>

            <div className="hidden md:block">
              <DropdownMenu
                ref={profileDropdownRef}
                menuClassName="menu mt-2 w-44 rounded-box border border-base-300 bg-base-100 shadow-lg"
                trigger={({ toggle }) => (
                  <button
                    type="button"
                    className="btn btn-ghost gap-2 px-2"
                    onClick={() => {
                      toggle();
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <div className="avatar placeholder">
                      <div className="w-8 rounded-full bg-neutral text-neutral-content" />
                    </div>
                    <span className="text-sm font-medium">
                      {authUser?.fullName || "Admin"}
                    </span>
                  </button>
                )}
              >
                <ul>
                  <li>
                    <button
                      type="button"
                      onClick={() => navigateTo("/settings")}
                    >
                      Settings
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => navigateTo("/activity-log")}
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
            </div>

            <button
              type="button"
              className="btn btn-ghost btn-circle md:hidden"
              aria-expanded={isMobileMenuOpen}
              aria-label={
                isMobileMenuOpen
                  ? "Close navigation menu"
                  : "Open navigation menu"
              }
              onClick={handleToggleMobileMenu}
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {isMobileMenuOpen ? (
          <div className="mt-4 border-t border-base-300 pt-4 md:hidden">
            <div className="flex flex-col gap-2">
              <button
                type="button"
                className="btn btn-ghost justify-start"
                onClick={() => navigateTo("/dashboard")}
              >
                Home
              </button>
              <button
                type="button"
                className="btn btn-ghost justify-start"
                onClick={() => navigateTo("/settings")}
              >
                Settings
              </button>
              <button
                type="button"
                className="btn btn-ghost justify-start"
                onClick={() => navigateTo("/activity-log")}
              >
                Activity Log
              </button>
              <button
                type="button"
                disabled={isLoggingOut}
                className="btn btn-ghost justify-start text-error hover:bg-error hover:text-error-content"
                onClick={handleLogout}
              >
                {isLoggingOut ? "Logging out..." : "Log out"}
              </button>
            </div>

            <div className="mt-4 flex items-center gap-3 rounded-xl border border-base-300 bg-base-200/40 px-4 py-3">
              <div className="avatar placeholder">
                <div className="w-10 rounded-full bg-neutral text-neutral-content" />
              </div>
              <div>
                <p className="text-sm font-semibold">
                  {authUser?.fullName || "Admin"}
                </p>
                <p className="text-xs text-base-content/60">Administrator</p>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}

export default Header;
