import React, { useEffect, useRef, useImperativeHandle } from "react";
import WaveSurfer from "wavesurfer.js";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.js";

const AudioTrack = React.forwardRef(
  ({ blob, playbackRate, volume, isSelected, onClick, onDelete }, ref) => {
    const containerRef = useRef(null);
    const waveSurferRef = useRef(null);
    const regionsPluginRef = useRef(null);
    const trimRegionRef = useRef(null); // Holds the current region boundaries for trimming.

    useEffect(() => {
      // Create Regions plugin instance with drag/resize enabled.
      regionsPluginRef.current = RegionsPlugin.create({
        drag: true,
        resize: true,
      });

      // Create the WaveSurfer instance.
      waveSurferRef.current = WaveSurfer.create({
        container: containerRef.current,
        waveColor: "cyan",
        progressColor: "blue",
        height: 150,
        responsive: true,
        backend: "WebAudio",
        barWidth: 3,
        plugins: [regionsPluginRef.current],
      });

      // When the audio is ready, add a default region.
      waveSurferRef.current.on("ready", () => {
        const duration = waveSurferRef.current.getDuration();
        const regionStart = duration > 2 ? 0.5 : 0;
        const regionEnd = duration > 2 ? 2 : duration;
        if (regionsPluginRef.current) {
          const region = regionsPluginRef.current.addRegion({
            start: regionStart,
            end: regionEnd,
            color: "rgba(0, 255, 0, 0.3)",
            drag: true,
            resize: true,
          });
          // Save the initial region boundaries.
          trimRegionRef.current = { start: region.start, end: region.end };

          // Update the boundaries after dragging/resizing.
          region.on("update-end", () => {
            trimRegionRef.current = { start: region.start, end: region.end };
          });
        }
      });

      // Load the audio blob.
      if (blob) {
        waveSurferRef.current.loadBlob(blob);
      }

      return () => {
        if (waveSurferRef.current) waveSurferRef.current.destroy();
      };
    }, [blob]);

    // Update playbackRate when prop changes.
    useEffect(() => {
      if (waveSurferRef.current) {
        waveSurferRef.current.setPlaybackRate(playbackRate);
      }
    }, [playbackRate]);

    // Update volume when prop changes.
    useEffect(() => {
      if (waveSurferRef.current) {
        waveSurferRef.current.setVolume(volume);
      }
    }, [volume]);

    // Expose methods for parent component use.
    useImperativeHandle(ref, () => ({
      getTrimRegion: () => trimRegionRef.current,
      play: () => {
        if (waveSurferRef.current) waveSurferRef.current.play();
      },
      pause: () => {
        if (waveSurferRef.current) waveSurferRef.current.pause();
      },
      stop: () => {
        if (waveSurferRef.current) waveSurferRef.current.stop();
      },
      setVolume: (val) => {
        if (waveSurferRef.current) waveSurferRef.current.setVolume(val);
      },
      setPlaybackRate: (val) => {
        if (waveSurferRef.current) waveSurferRef.current.setPlaybackRate(val);
      }
    }));

    return (
      <div
        style={{
          display: "flex",
          border: isSelected ? "3px solid red" : "1px solid gray",
          padding: "5px",
          marginBottom: "10px",
          width: "90%",
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        {/* Left-side button panel */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginRight: "10px",
            justifyContent: "center",
          }}
        >
          <button style={{ marginBottom: "5px" }} onClick={onClick} className="btn btn-success">
            Select Track
          </button>
          <button className="btn btn-danger" onClick={onDelete}>Delete Track</button>
        </div>
        {/* WaveSurfer container */}
        <div ref={containerRef} style={{ flex: 1 }} />
      </div>
    );
  }
);

export default AudioTrack;
