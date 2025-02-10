import React from 'react';
import { 
  FaPlay, 
  FaPause, 
  FaStop, 
  FaVolumeUp, 
  FaVolumeMute, 
  FaTachometerAlt 
} from 'react-icons/fa';

const TrackControls = ({ trackRef, volume, setVolume, playbackRate, setPlaybackRate }) => {
  const handlePlay = () => {
    if (trackRef && trackRef.current && trackRef.current.play) {
      trackRef.current.play();
    }
  };

  const handlePause = () => {
    if (trackRef && trackRef.current && trackRef.current.pause) {
      trackRef.current.pause();
    }
  };

  const handleStop = () => {
    if (trackRef && trackRef.current && trackRef.current.stop) {
      trackRef.current.stop();
    }
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (trackRef && trackRef.current && trackRef.current.setVolume) {
      trackRef.current.setVolume(val);
    }
  };

  const handleRateChange = (e) => {
    const val = parseFloat(e.target.value);
    setPlaybackRate(val);
    if (trackRef && trackRef.current && trackRef.current.setPlaybackRate) {
      trackRef.current.setPlaybackRate(val);
    }
  };

  return (
    <div style={{ margin: '10px 0', textAlign: 'center' }}>
      {/* Playback control buttons */}
      <div className="btn-group" role="group" aria-label="Playback Controls">
        <button onClick={handlePlay} className="btn btn-primary mx-1">
          <FaPlay size={20} />
        </button>
        <button onClick={handlePause} className="btn btn-secondary mx-1">
          <FaPause size={20} />
        </button>
        <button onClick={handleStop} className="btn btn-danger mx-1">
          <FaStop size={20} />
        </button>
      </div>

      {/* Volume control */}
      <div className="d-flex align-items-center justify-content-center mt-3">
        {volume > 0 ? (
          <FaVolumeUp className="mx-2" size={20} />
        ) : (
          <FaVolumeMute className="mx-2" size={20} />
        )}
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={volume}
          onChange={handleVolumeChange}
          style={{ width: '200px' }}
        />
      </div>

      {/* Playback rate control */}
      <div className="d-flex align-items-center justify-content-center mt-3">
        <FaTachometerAlt className="mx-2" size={20} />
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          value={playbackRate}
          onChange={handleRateChange}
          style={{ width: '200px' }}
        />
      </div>
    </div>
  );
};

export default TrackControls;
