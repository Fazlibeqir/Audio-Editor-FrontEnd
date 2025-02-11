import React from 'react';
import { trimAudio } from '../../../utils/audioEffects';

const TrimButton = ({ selectedTrack, updateTrack, audioContext }) => {
  const handleTrim = async () => {
    if (!selectedTrack) {
      alert("Select a track to trim.");
      return;
    }
    if (!selectedTrack.ref || !selectedTrack.ref.current) {
      alert("No track available for trimming.");
      return;
    }
    const region = selectedTrack.ref.current.getTrimRegion();
    if (!region) {
      alert("No trim region set.");
      return;
    }
    try {
      const trimmedBlob = await trimAudio(selectedTrack.blob, region, audioContext.current);
      updateTrack(selectedTrack.id, trimmedBlob);
    } catch (error) {
      console.error("Error trimming track:", error);
    }
  };

  return (
    <button className="btn btn-warning" onClick={handleTrim}>
      ✂
    </button>
  );
};

export default TrimButton;
