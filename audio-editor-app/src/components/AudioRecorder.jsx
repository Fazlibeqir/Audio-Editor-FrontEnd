import React, { useEffect, useRef, useState } from "react";
import AudioTrack from "./AudioTrack";
import "bootstrap/dist/css/bootstrap.min.css";

const AudioRecorder = () => {
  // Each track is an object: { id, blob, type ("import" or "record"), ref }
  const [tracks, setTracks] = useState([]);
  const [selectedTrackId, setSelectedTrackId] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const audioContextRef = useRef(null);
  const fileInputRef = useRef(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(1);

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    return () => {
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  // Helper to add or update a track.
  const addOrUpdateTrack = (newBlob, type) => {
    setTracks((prevTracks) => {
      let updatedTracks = [...prevTracks];
      if (type === "record") {
        // Only one recording track is allowed.
        const existingIndex = updatedTracks.findIndex((t) => t.type === "record");
        if (existingIndex !== -1) {
          updatedTracks[existingIndex] = { ...updatedTracks[existingIndex], blob: newBlob };
          return updatedTracks;
        } else {
          if (updatedTracks.length < 3) {
            const newTrack = { id: Date.now(), blob: newBlob, type: type, ref: React.createRef() };
            // Auto-select the new track.
            setSelectedTrackId(newTrack.id);
            return [...updatedTracks, newTrack];
          } else {
            alert("Maximum track limit reached (3 tracks).");
            return updatedTracks;
          }
        }
      } else if (type === "import") {
        // Maximum of two import tracks.
        const importCount = updatedTracks.filter((t) => t.type === "import").length;
        if (importCount >= 2) {
          alert("Maximum import tracks reached (2 imports).");
          return updatedTracks;
        } else {
          if (updatedTracks.length < 3) {
            const newTrack = { id: Date.now(), blob: newBlob, type: type, ref: React.createRef() };
            setSelectedTrackId(newTrack.id);
            return [...updatedTracks, newTrack];
          } else {
            alert("Maximum track limit reached (3 tracks).");
            return updatedTracks;
          }
        }
      } else {
        return updatedTracks;
      }
    });
  };

  const handlePlaybackRateChange = (event) => {
    setPlaybackRate(parseFloat(event.target.value));
  };

  const handleVolumeChange = (event) => {
    setVolume(parseFloat(event.target.value));
  };

  const handleRecord = async () => {
    if (!isRecording) {
      await audioContextRef.current.resume();
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        setMediaRecorder(recorder);
        const chunks = [];
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };
        recorder.onstop = () => {
          const newAudioBlob = new Blob(chunks, { type: "audio/webm" });
          addOrUpdateTrack(newAudioBlob, "record");
        };
        recorder.start();
        setIsRecording(true);
      } catch (error) {
        console.error("Error accessing microphone:", error);
      }
    } else {
      if (mediaRecorder) {
        mediaRecorder.stop();
        setIsRecording(false);
      }
    }
  };

  const handleImportClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.readAsArrayBuffer(file);
      reader.onloadend = () => {
        const importedBlob = new Blob([reader.result], { type: file.type });
        addOrUpdateTrack(importedBlob, "import");
      };
    }
  };

  const handleExport = () => {
    if (tracks.length > 0) {
      // Export the selected track if one is selected; otherwise, export the last track.
      const trackToExport =
        tracks.find((t) => t.id === selectedTrackId) || tracks[tracks.length - 1];
      const url = URL.createObjectURL(trackToExport.blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "recording.webm";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  // --- WAV Encoding Helpers ---
  const encodeWav = async (audioBuffer) => {
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const samples = audioBuffer.length;
    const blockAlign = numChannels * 2; // 2 bytes per sample
    const bufferLength = 44 + samples * blockAlign;
    const buffer = new ArrayBuffer(bufferLength);
    const view = new DataView(buffer);
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    let offset = 0;
    writeString(offset, "RIFF");
    offset += 4;
    view.setUint32(offset, 36 + samples * blockAlign, true);
    offset += 4;
    writeString(offset, "WAVE");
    offset += 4;
    writeString(offset, "fmt ");
    offset += 4;
    view.setUint32(offset, 16, true);
    offset += 4;
    view.setUint16(offset, 1, true);
    offset += 2;
    view.setUint16(offset, numChannels, true);
    offset += 2;
    view.setUint32(offset, sampleRate, true);
    offset += 4;
    view.setUint32(offset, sampleRate * blockAlign, true);
    offset += 4;
    view.setUint16(offset, blockAlign, true);
    offset += 2;
    view.setUint16(offset, 16, true);
    offset += 2;
    writeString(offset, "data");
    offset += 4;
    view.setUint32(offset, samples * blockAlign, true);
    offset += 4;
    const channels = [];
    for (let i = 0; i < numChannels; i++) {
      channels.push(audioBuffer.getChannelData(i));
    }
    for (let i = 0; i < samples; i++) {
      for (let channel = 0; channel < numChannels; channel++) {
        let sample = channels[channel][i];
        sample = Math.max(-1, Math.min(1, sample));
        const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        view.setInt16(offset, intSample, true);
        offset += 2;
      }
    }
    return buffer;
  };

  const bufferToBlob = async (audioBuffer) => {
    const wavBuffer = await encodeWav(audioBuffer);
    return new Blob([wavBuffer], { type: "audio/wav" });
  };

  // When trimming, update the selected track in place.
  const handleTrim = async () => {
    if (tracks.length === 0) return;
    if (!selectedTrackId) {
      alert("Select a track to trim.");
      return;
    }
    const selectedTrack = tracks.find((t) => t.id === selectedTrackId);
    if (!selectedTrack || !selectedTrack.ref || !selectedTrack.ref.current) {
      alert("No track available for trimming.");
      return;
    }
    // Get the current region (dragged/resized by the user) from the AudioTrack.
    const region = selectedTrack.ref.current.getTrimRegion();
    if (!region) {
      alert("No trim region set.");
      return;
    }
    const { start, end } = region;
    const arrayBuffer = await selectedTrack.blob.arrayBuffer();
    const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
    const sampleRate = audioBuffer.sampleRate;
    const startSample = Math.floor(start * sampleRate);
    const endSample = Math.floor(end * sampleRate);
    const trimmedBuffer = audioContextRef.current.createBuffer(
      audioBuffer.numberOfChannels,
      endSample - startSample,
      sampleRate
    );
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const oldData = audioBuffer.getChannelData(channel);
      const newData = trimmedBuffer.getChannelData(channel);
      newData.set(oldData.slice(startSample, endSample));
    }
    const offlineContext = new OfflineAudioContext(
      trimmedBuffer.numberOfChannels,
      trimmedBuffer.length,
      sampleRate
    );
    const source = offlineContext.createBufferSource();
    source.buffer = trimmedBuffer;
    source.connect(offlineContext.destination);
    source.start();
    const renderedBuffer = await offlineContext.startRendering();
    const trimmedBlob = await bufferToBlob(renderedBuffer);
    // Update the selected track's blob in place.
    setTracks((prevTracks) =>
      prevTracks.map((t) =>
        t.id === selectedTrack.id ? { ...t, blob: trimmedBlob } : t
      )
    );
  };

  // For fade effects, operate on the selected track (if one is selected).
  const handleFadeIn = async () => {
    if (tracks.length === 0) return;
    if (!selectedTrackId) {
      alert("Select a track to apply Fade In.");
      return;
    }
    const selectedTrack = tracks.find((t) => t.id === selectedTrackId);
    const arrayBuffer = await selectedTrack.blob.arrayBuffer();
    const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
    const fadeDuration = 1; // seconds
    const sampleRate = audioBuffer.sampleRate;
    const fadeSamples = Math.floor(fadeDuration * sampleRate);
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      for (let i = 0; i < fadeSamples && i < channelData.length; i++) {
        channelData[i] *= i / fadeSamples;
      }
    }
    const fadedBlob = await bufferToBlob(audioBuffer);
    addOrUpdateTrack(fadedBlob, selectedTrack.type);
  };

  const handleFadeOut = async () => {
    if (tracks.length === 0) return;
    if (!selectedTrackId) {
      alert("Select a track to apply Fade Out.");
      return;
    }
    const selectedTrack = tracks.find((t) => t.id === selectedTrackId);
    const arrayBuffer = await selectedTrack.blob.arrayBuffer();
    const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
    const fadeDuration = 1; // seconds
    const sampleRate = audioBuffer.sampleRate;
    const fadeSamples = Math.floor(fadeDuration * sampleRate);
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      for (let i = 0; i < fadeSamples && i < channelData.length; i++) {
        const index = channelData.length - i - 1;
        channelData[index] *= i / fadeSamples;
      }
    }
    const fadedBlob = await bufferToBlob(audioBuffer);
    addOrUpdateTrack(fadedBlob, selectedTrack.type);
  };

  return (
    <div className="d-flex flex-column vh-100 bg-black text-white">
      {/* Top Menu Bar */}
      <div className="d-flex bg-dark p-2">
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
                FadeIn
              </button>
            </li>
            <li>
              <button className="dropdown-item" onClick={handleFadeOut}>
                FadeOut
              </button>
            </li>
          </ul>
        </div>
        {/* Edit Dropdown (Placeholders for Play/Pause or Stop) */}
        <div className="dropdown me-3">
          <button className="btn btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
            Edit
          </button>
          <ul className="dropdown-menu">
            <li>
              <button className="dropdown-item" onClick={() => {}}>
                Play/Pause
              </button>
            </li>
            <li>
              <button className="dropdown-item" onClick={() => {}}>
                Stop
              </button>
            </li>
          </ul>
        </div>
        {/* Controls */}
        <div className="d-flex align-items-center ms-auto">
          <label className="me-2">Speed:</label>
          <input type="range" min="0.5" max="2" step="0.1" value={playbackRate} onChange={handlePlaybackRateChange} />
          <label className="ms-3 me-2">Volume:</label>
          <input type="range" min="0" max="1" step="0.1" value={volume} onChange={handleVolumeChange} />
        </div>
        {/* Hidden File Input */}
        <input type="file" ref={fileInputRef} style={{ display: "none" }} onChange={handleFileChange} />
      </div>

      {/* Main Layout */}
      <div className="d-flex flex-grow-1">
        {/* Sidebar */}
        <div className="d-flex flex-column align-items-center justify-content-center p-3 bg-dark vh-100" style={{ width: "80px", gap: "1.5rem" }}>
          <button className="btn btn-secondary" onClick={handleRecord}>
            {isRecording ? "Stop" : "Record"}
          </button>
          <button className="btn btn-warning" onClick={handleTrim}>
            ✂
          </button>
          <button className="btn btn-success" onClick={handleExport}>
            💾
          </button>
        </div>

        {/* Waveform Display Container (tracks stack vertically) */}
        <div className="flex-grow-1 overflow-auto" style={{ display: "flex", flexDirection: "column" }}>
          {tracks.map((track) => (
            <AudioTrack
              key={track.id}
              ref={track.ref}
              blob={track.blob}
              playbackRate={playbackRate}
              volume={volume}
              isSelected={track.id === selectedTrackId}
              onClick={() => setSelectedTrackId(track.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default AudioRecorder;
