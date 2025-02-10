import React from "react";
import { FiSun } from "react-icons/fi";

export default function Header({ toggleMode }) {
  return (
    <div
      className="d-flex bg-dark p-2 justify-content-between align-items-center"
      style={{ height: "50px", flexShrink: 0 }}
    >
      <div style={{ color: "white", fontSize: "18px" }}>
        Audio Editing Flow Editor
      </div>
      <button className="btn btn-outline-light" onClick={toggleMode}>
        <FiSun className="me-1" /> Toggle Mode
      </button>
    </div>
  );
}
