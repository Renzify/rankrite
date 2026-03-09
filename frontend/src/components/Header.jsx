import { useCallback, useEffect, useRef } from "react";
import { DropdownMenu } from "../helpers/Dropdown";
import { Bell } from "lucide-react";
function Header() {
  const notificationDropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);

  const closeAllDropdowns = useCallback(() => {
    notificationDropdownRef.current?.close();
    profileDropdownRef.current?.close();
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      const clickedInsideNotification =
        notificationDropdownRef.current?.containsTarget(event.target) ?? false;
      const clickedInsideProfile =
        profileDropdownRef.current?.containsTarget(event.target) ?? false;

      if (!clickedInsideNotification && !clickedInsideProfile) {
        closeAllDropdowns();
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        closeAllDropdowns();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [closeAllDropdowns]);

  return (
    <header className="navbar rounded-2xl border border-base-300 bg-base-100/95 px-4 shadow-sm">
      <div className="navbar-start gap-3 ml-15">
        <div className="avatar placeholder">
          <div className="w-10 rounded-full bg-primary text-primary-content"></div>
        </div>
        <div>
          <p className="text-lg font-bold">Rankrite</p>
        </div>
      </div>

      <div className="navbar-end gap-2 mr-15">
        <DropdownMenu
          ref={notificationDropdownRef}
          menuClassName="menu mt-2 w-72 rounded-box border border-base-300 bg-base-100 p-3 shadow-lg"
          trigger={({ toggle }) => (
            <button
              type="button"
              className="btn btn-ghost btn-circle"
              onClick={() => {
                toggle();
                profileDropdownRef.current?.close();
              }}
            >
              <Bell size={22} />
            </button>
          )}
        >
          <p className="mb-1 text-sm font-semibold">Notifications</p>
          <p className="text-xs text-base-content/60">
            No new notifications right now.
          </p>
        </DropdownMenu>

        <DropdownMenu
          ref={profileDropdownRef}
          menuClassName="menu mt-2 w-44 rounded-box border border-base-300 bg-base-100 shadow-lg"
          trigger={({ toggle }) => (
            <button
              type="button"
              className="btn btn-ghost gap-2 px-2"
              onClick={() => {
                toggle();
                notificationDropdownRef.current?.close();
              }}
            >
              <div className="avatar placeholder">
                <div className="w-8 rounded-full bg-neutral text-neutral-content"></div>
              </div>
              <span className="text-sm font-medium">Admin</span>
            </button>
          )}
        >
          <ul>
            <li>
              <button type="button">Profile</button>
            </li>
            <li>
              <button type="button">Settings</button>
            </li>
            <li>
              <button type="button">Activity Log</button>
            </li>
            <li>
              <button type="button">Log out</button>
            </li>
          </ul>
        </DropdownMenu>
      </div>
    </header>
  );
}

export default Header;
