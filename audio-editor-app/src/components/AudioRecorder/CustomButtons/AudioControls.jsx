import React from 'react';
import RecordButton from './RecordButton';
import TrimButton from './TrimButton';
import ExportButton from './ExportButton';

const AudioControls = ({ audioContext, addOrUpdateTrack, selectedTrack, updateTrack }) => {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center p-3 bg-dark vh-100" 
        style={{ width: "80px", gap: "1.5rem" }}>
      <RecordButton audioContext={audioContext} addOrUpdateTrack={addOrUpdateTrack} />
      <TrimButton selectedTrack={selectedTrack} updateTrack={updateTrack} audioContext={audioContext} />
      <ExportButton selectedTrack={selectedTrack} />
    </div>
  );
};

export default AudioControls;
