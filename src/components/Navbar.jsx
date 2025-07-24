import React from "react";
import { NavLink } from "react-router-dom";

const Navbar = ({ publicUrl }) => { // Accept publicUrl prop from App.jsx
  return (
    <nav className="bg-white px-6 py-4 shadow flex justify-between items-center border-b border-gray-200">
      {/* Logo + Title */}
      <div className="flex items-center space-x-3">
        <img src={`${publicUrl}/sbp-logo.png`} alt="SBP Logo" className="h-10 w-10 object-contain" />
        <span className="text-xl font-bold text-gray-800">SBP Dashboard</span> {/* Updated to match your UI */}
      </div>

      {/* Menu Links */}
      <div className="space-x-6">
        <NavLink
          to="/"
          className={({ isActive }) =>
            isActive ? "text-green-600 font-semibold" : "text-gray-800 hover:text-green-500"
          }
        >
          Summary
        </NavLink>
        <NavLink
          to="/bank"
          className={({ isActive }) =>
            isActive ? "text-green-600 font-semibold" : "text-gray-800 hover:text-green-500"
          }
        >
          Bank Insights
        </NavLink>
        <NavLink
          to="/category-summary"
          className={({ isActive }) =>
            isActive ? "text-green-600 font-semibold" : "text-gray-800 hover:text-green-500"
          }
        >
          Category Summary
        </NavLink>
      </div>
    </nav>
  );
};

export default Navbar;