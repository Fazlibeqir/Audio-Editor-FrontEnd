import React from 'react';

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
      <button onClick={handlePlay}>Play</button>
      <button onClick={handlePause}>Pause</button>
      <button onClick={handleStop}>Stop</button>
      <div>
        <label>Volume: </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={volume}
          onChange={handleVolumeChange}
        />
      </div>
      <div>
        <label>Playback Rate: </label>
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          value={playbackRate}
          onChange={handleRateChange}
        />
      </div>
    </div>
  );
};

export default TrackControls;
