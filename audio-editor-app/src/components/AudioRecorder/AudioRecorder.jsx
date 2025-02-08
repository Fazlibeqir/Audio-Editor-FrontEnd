// AudioRecorder.jsx
import React, { useEffect, useRef, useState } from 'react'; 
import AudioTrack from './AudioTrack';
import audioService from '../../service/audioService';
import TrackControls from './TrackControls';
import { bufferToBlob } from '../../utils/audioUtils';
import AudioTrackModel from '../../models/AudioTrackModel';
import 'bootstrap/dist/css/bootstrap.min.css';

const AudioRecorder = ({ toggleMode }) => {
  // State and refs for tracks, recording, etc.
  const [tracks, setTracks] = useState([]);
  const [selectedTrackId, setSelectedTrackId] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const audioContextRef = useRef(null);
  const fileInputRef = useRef(null);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [downloadUrl, setDownloadUrl] = useState(null);

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    return () => {
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  // Helper function to add or update a track.
  const addOrUpdateTrack = (newBlob, type) => {
    setTracks(prevTracks => {
      let updatedTracks = [...prevTracks];
      if (type === 'record') {
        // Only one recording track is allowed.
        const existingIndex = updatedTracks.findIndex(t => t.type === 'record');
        if (existingIndex !== -1) {
          updatedTracks[existingIndex] = new AudioTrackModel({ 
            ...updatedTracks[existingIndex],
            blob: newBlob 
          });
          return updatedTracks;
        } else {
          if (updatedTracks.length < 3) {
            const newTrack = new AudioTrackModel({ id: Date.now(), blob: newBlob, type, ref: React.createRef() });
            setSelectedTrackId(newTrack.id);
            return [...updatedTracks, newTrack];
          } else {
            alert("Maximum track limit reached (3 tracks).");
            return updatedTracks;
          }
        }
      } else if (type === 'import') {
        // Maximum of two import tracks.
        const importCount = updatedTracks.filter(t => t.type === 'import').length;
        if (importCount >= 2) {
          alert("Maximum import tracks reached (2 imports).");
          return updatedTracks;
        } else {
          if (updatedTracks.length < 3) {
            const newTrack = new AudioTrackModel({ id: Date.now(), blob: newBlob, type, ref: React.createRef() });
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

  const handleRecord = async () => {
    if (!isRecording) {
      await audioContextRef.current.resume();
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        setMediaRecorder(recorder);
        const chunks = [];
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) chunks.push(event.data);
        };
        recorder.onstop = () => {
          const newAudioBlob = new Blob(chunks, { type: "audio/webm" });
          addOrUpdateTrack(newAudioBlob, "record");
          // Optionally, you can upload here:
          // audioService.uploadTrack({ file: newAudioBlob });
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

  const handleExport = async () => {
    if (tracks.length > 0) {
      const trackToExport =
        tracks.find(t => t.id === selectedTrackId) || tracks[tracks.length - 1];
      try {
        const response = await audioService.uploadTrack({ file: trackToExport.blob });
        setDownloadUrl(response.data);
        const a = document.createElement("a");
        a.href = response.data;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch (error) {
        console.error("Error exporting track:", error);
      }
    }
  };

  const handleMergeTracks = async () => {
    if (tracks.length > 0) {
      try {
        const blobs = tracks.map(track => track.blob);
        const response = await audioService.mergeTracks(blobs);
        setDownloadUrl(response.data);
        const a = document.createElement("a");
        a.href = response.data;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch (error) {
        console.error("Error merging tracks:", error);
      }
    } else {
      alert("No tracks available to merge.");
    }
  };

  const handleTrim = async () => {
    if (tracks.length === 0) return;
    if (!selectedTrackId) {
      alert("Select a track to trim.");
      return;
    }
    const selectedTrack = tracks.find(t => t.id === selectedTrackId);
    if (!selectedTrack || !selectedTrack.ref || !selectedTrack.ref.current) {
      alert("No track available for trimming.");
      return;
    }
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
    setTracks(prevTracks =>
      prevTracks.map(t =>
        t.id === selectedTrack.id ? new AudioTrackModel({ ...t, blob: trimmedBlob }) : t
      )
    );
  };

  const handleFadeIn = async () => {
    if (tracks.length === 0) return;
    if (!selectedTrackId) {
      alert("Select a track to apply Fade In.");
      return;
    }
    const selectedTrack = tracks.find(t => t.id === selectedTrackId);
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
    const selectedTrack = tracks.find(t => t.id === selectedTrackId);
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
      {/* Top Navigation Bar */}
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
          {/* Edit Dropdown */}
          <div className="dropdown me-3">
            <button className="btn btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
              Edit
            </button>
            <ul className="dropdown-menu">
              <li>
                <button
                  className="dropdown-item"
                  onClick={() => {
                    const selectedTrack = tracks.find(t => t.id === selectedTrackId);
                    if (selectedTrack && selectedTrack.ref && selectedTrack.ref.current) {
                      selectedTrack.ref.current.play();
                    }
                  }}
                >
                  Play
                </button>
              </li>
              <li>
                <button
                  className="dropdown-item"
                  onClick={() => {
                    const selectedTrack = tracks.find(t => t.id === selectedTrackId);
                    if (selectedTrack && selectedTrack.ref && selectedTrack.ref.current) {
                      selectedTrack.ref.current.pause();
                    }
                  }}
                >
                  Pause
                </button>
              </li>
              <li>
                <button
                  className="dropdown-item"
                  onClick={() => {
                    const selectedTrack = tracks.find(t => t.id === selectedTrackId);
                    if (selectedTrack && selectedTrack.ref && selectedTrack.ref.current) {
                      selectedTrack.ref.current.stop();
                    }
                  }}
                >
                  Stop
                </button>
              </li>
            </ul>
          </div>
        </div>
        {/* Toggle Mode Button */}
        <button className="btn btn-primary" onClick={toggleMode}>
          Toggle Mode
        </button>
      </div>

      {/* Hidden File Input */}
      <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />

      {/* Track Controls for Selected Track */}
      <div style={{ padding: "10px", backgroundColor: "#333", textAlign: "center" }}>
        {selectedTrackId && (
          <TrackControls
            trackRef={tracks.find(t => t.id === selectedTrackId)?.ref}
            volume={volume}
            setVolume={setVolume}
            playbackRate={playbackRate}
            setPlaybackRate={setPlaybackRate}
          />
        )}
      </div>

      {/* Main Layout */}
      <div className="d-flex flex-grow-1 bg-black">
        <div
          className="d-flex flex-column align-items-center justify-content-center p-3 bg-dark vh-100"
          style={{ width: "80px", gap: "1.5rem" }}
        >
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
        <div
          className="flex-grow-1 overflow-auto"
          style={{ display: "flex", flexDirection: "column" }}
        >
          {tracks.map(track => (
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
