import React from 'react';
import audioService from '../../../service/audioService';

const ExportButton = ({ selectedTrack }) => {
  const handleExport = async () => {
    if (!selectedTrack) {
      alert("No track selected for export.");
      return;
    }
    try {
      const response = await audioService.uploadTrack({ file: selectedTrack.blob });
      const a = document.createElement('a');
      a.href = response.data;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error exporting track:", error);
    }
  };

  return (
    <button className="btn btn-success" onClick={handleExport}>
      💾
    </button>
  );
};

export default ExportButton;
