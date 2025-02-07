import React, { useEffect, useRef, useImperativeHandle } from "react";
import WaveSurfer from "wavesurfer.js";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.js";

// Use forwardRef so the parent can call methods (like getTrimRegion)
const AudioTrack = React.forwardRef(
  ({ blob, playbackRate, volume, isSelected, onClick }, ref) => {
    const containerRef = useRef(null);
    const waveSurferRef = useRef(null);
    const regionsPluginRef = useRef(null);
    // New ref to store the current region boundaries.
    const trimRegionRef = useRef(null);

    useEffect(() => {
      // Create a Regions plugin instance with drag/resize enabled.
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

      // When audio is ready, add a default region and update our trimRegionRef.
      waveSurferRef.current.on("ready", () => {
        const duration = waveSurferRef.current.getDuration();
        // Set a default region (if duration allows)
        const regionStart = duration > 2 ? 0.5 : 0;
        const regionEnd = duration > 2 ? 2 : duration;
        if (regionsPluginRef.current) {
          // Add the region and store a reference to it.
          const region = regionsPluginRef.current.addRegion({
            start: regionStart,
            end: regionEnd,
            color: "rgba(0, 255, 0, 0.3)",
            drag: true,
            resize: true,
          });
          // Save the initial region boundaries.
          trimRegionRef.current = { start: region.start, end: region.end };

          // When the user finishes dragging/resizing, update our ref.
          region.on("update-end", () => {
            trimRegionRef.current = { start: region.start, end: region.end };
          });
        }
      });

      // Load the blob into WaveSurfer.
      if (blob) {
        waveSurferRef.current.loadBlob(blob);
      }

      return () => {
        if (waveSurferRef.current) waveSurferRef.current.destroy();
      };
    }, [blob]);

    // Update playback rate.
    useEffect(() => {
      if (waveSurferRef.current) {
        waveSurferRef.current.setPlaybackRate(playbackRate);
      }
    }, [playbackRate]);

    // Update volume.
    useEffect(() => {
      if (waveSurferRef.current) {
        waveSurferRef.current.setVolume(volume);
      }
    }, [volume]);

    // Expose a method for the parent to get the current region boundaries.
    useImperativeHandle(ref, () => ({
      getTrimRegion: () => {
        return trimRegionRef.current;
      },
    }));

    return (
      <div
        onClick={onClick}
        style={{
          border: isSelected ? "3px solid red" : "1px solid gray",
          padding: "5px",
          marginBottom: "10px",
          cursor: "pointer",
          width: "90%",
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        <div ref={containerRef} />
      </div>
    );
  }
);

export default AudioTrack;
