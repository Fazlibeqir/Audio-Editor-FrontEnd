import React from 'react';
import { 
  FiFolder, 
  FiUpload, 
  FiDownload, 
  FiLayers, 
  FiSliders, 
  FiArrowUp, 
  FiArrowDown, 
  FiSun 
} from 'react-icons/fi';

const TopNavigation = ({
  toggleMode,
  handleImportClick,
  handleExport,
  handleMergeTracks,
  handleFadeIn,
  handleFadeOut
}) => {
  return (
    <div className="d-flex bg-dark p-2 justify-content-between align-items-center">
      <div className="d-flex">
        {/* File Dropdown */}
        <div className="dropdown me-3">
          <button
            className="btn btn-outline-light dropdown-toggle"
            type="button"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            <FiFolder className="me-1" /> File
          </button>
          <ul className="dropdown-menu dropdown-menu-dark">
            <li>
              <button className="dropdown-item" onClick={handleImportClick}>
                <FiUpload className="me-1" /> Import
              </button>
            </li>
            <li>
              <button className="dropdown-item" onClick={handleExport}>
                <FiDownload className="me-1" /> Export
              </button>
            </li>
            <li>
              <button className="dropdown-item" onClick={handleMergeTracks}>
                <FiLayers className="me-1" /> Merge Tracks
              </button>
            </li>
          </ul>
        </div>
        {/* Effects Dropdown */}
        <div className="dropdown me-3">
          <button
            className="btn btn-outline-light dropdown-toggle"
            type="button"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            <FiSliders className="me-1" /> Effects
          </button>
          <ul className="dropdown-menu dropdown-menu-dark">
            <li>
              <button className="dropdown-item" onClick={handleFadeIn}>
                <FiArrowUp className="me-1" /> Fade In
              </button>
            </li>
            <li>
              <button className="dropdown-item" onClick={handleFadeOut}>
                <FiArrowDown className="me-1" /> Fade Out
              </button>
            </li>
          </ul>
        </div>
      </div>
      <button className="btn btn-outline-light" onClick={toggleMode}>
        <FiSun className="me-1" /> Toggle Mode
      </button>
    </div>
  );
};

export default TopNavigation;
