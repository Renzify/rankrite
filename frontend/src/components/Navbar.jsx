import React from "react";
import { NavLink } from "react-router";

function Navbar() {
  return (
    <nav className="navbar border-b border-base-300 bg-base-100/90 px-4">
      <div className="w-full max-w-7xl flex flex-col md:flex-row justify-between items-center gap-4 mx-auto">
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
    </nav>
  );
}

export default Navbar;
