import React from 'react';

const TopNavigation = ({
  toggleMode,
  handleImportClick,
  handleExport,
  handleMergeTracks,
  handleFadeIn,
  handleFadeOut,
  handlePlay,
  handlePause,
  handleStop
}) => {
  return (
    <div className="d-flex bg-dark p-2 justify-content-between align-items-center">
      <div className="d-flex">
        {/* File Dropdown */}
        <div className="dropdown me-3">
          <button className="btn btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
            File
          </button>
          <ul className="dropdown-menu">
            <li>
              <button className="dropdown-item" onClick={handleImportClick}>
                Import
              </button>
            </li>
            <li>
              <button className="dropdown-item" onClick={handleExport}>
                Export
              </button>
            </li>
            <li>
              <button className="dropdown-item" onClick={handleMergeTracks}>
                Merge Tracks
              </button>
            </li>
          </ul>
        </div>
        {/* Effects Dropdown */}
        <div className="dropdown me-3">
          <button className="btn btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
            Effects
          </button>
          <ul className="dropdown-menu">
            <li>
              <button className="dropdown-item" onClick={handleFadeIn}>
                Fade In
              </button>
            </li>
            <li>
              <button className="dropdown-item" onClick={handleFadeOut}>
                Fade Out
              </button>
            </li>
          </ul>
        </div>
      </div>
      <button className="btn btn-primary" onClick={toggleMode}>
        Toggle Mode
      </button>
    </div>
  );
};

export default TopNavigation;
