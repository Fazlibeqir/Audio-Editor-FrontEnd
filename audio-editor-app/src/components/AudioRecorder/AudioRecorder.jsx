import React, { useEffect, useRef, useState } from 'react';
import AudioTrack from './AudioTrack';
import TrackControls from './TrackControls';
import TopNavigation from './TopNavigation';
import FileInput from './FileInput';
import audioService from '../../service/audioService';
import AudioTrackModel from '../../models/AudioTrackModel';
import { trimAudio, applyFadeIn, applyFadeOut } from '../../utils/audioEffects';
import 'bootstrap/dist/css/bootstrap.min.css';

//TODO: Refactorize on more files components

const AudioRecorder = ({ toggleMode }) => {
  const [tracks, setTracks] = useState([]);
  const [selectedTrackId, setSelectedTrackId] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const audioContextRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    return () => {
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  // Add or update a track based on its type.
  const addOrUpdateTrack = (newBlob, type) => {
    setTracks(prevTracks => {
      let updatedTracks = [...prevTracks];
      if (type === 'record') {
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

  // Recording logic.
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
          // Optionally, you could upload here:
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

  // Import logic.
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

  // Export logic.
  const handleExport = async () => {
    if (tracks.length > 0) {
      const trackToExport =
        tracks.find(t => t.id === selectedTrackId) || tracks[tracks.length - 1];
      try {
        const response = await audioService.uploadTrack({ file: trackToExport.blob });
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

  // Merge logic.
  const handleMergeTracks = async () => {
    if (tracks.length > 0) {
      try {
        const blobs = tracks.map(track => track.blob);
        const response = await audioService.mergeTracks(blobs);
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

  // Trim logic using the extracted utility.
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
    try {
      const trimmedBlob = await trimAudio(selectedTrack.blob, region, audioContextRef.current);
      setTracks(prevTracks =>
        prevTracks.map(t =>
          t.id === selectedTrack.id ? new AudioTrackModel({ ...t, blob: trimmedBlob }) : t
        )
      );
    } catch (error) {
      console.error("Error trimming track:", error);
    }
  };

  // Fade in/out logic using the extracted utilities.
  const handleFadeIn = async () => {
    if (tracks.length === 0) return;
    if (!selectedTrackId) {
      alert("Select a track to apply Fade In.");
      return;
    }
    const selectedTrack = tracks.find(t => t.id === selectedTrackId);
    try {
      const fadedBlob = await applyFadeIn(selectedTrack.blob, audioContextRef.current, 1);
      addOrUpdateTrack(fadedBlob, selectedTrack.type);
    } catch (error) {
      console.error("Error applying fade in:", error);
    }
  };

  const handleFadeOut = async () => {
    if (tracks.length === 0) return;
    if (!selectedTrackId) {
      alert("Select a track to apply Fade Out.");
      return;
    }
    const selectedTrack = tracks.find(t => t.id === selectedTrackId);
    try {
      const fadedBlob = await applyFadeOut(selectedTrack.blob, audioContextRef.current, 1);
      addOrUpdateTrack(fadedBlob, selectedTrack.type);
    } catch (error) {
      console.error("Error applying fade out:", error);
    }
  };

  // Edit controls for play, pause, and stop.
  const handlePlay = () => {
    const selectedTrack = tracks.find(t => t.id === selectedTrackId);
    if (selectedTrack && selectedTrack.ref && selectedTrack.ref.current) {
      selectedTrack.ref.current.play();
    }
  };

  const handlePause = () => {
    const selectedTrack = tracks.find(t => t.id === selectedTrackId);
    if (selectedTrack && selectedTrack.ref && selectedTrack.ref.current) {
      selectedTrack.ref.current.pause();
    }
  };

  const handleStop = () => {
    const selectedTrack = tracks.find(t => t.id === selectedTrackId);
    if (selectedTrack && selectedTrack.ref && selectedTrack.ref.current) {
      selectedTrack.ref.current.stop();
    }
  };

  return (
    <div className="d-flex flex-column vh-100 bg-black text-white">
      <TopNavigation
        toggleMode={toggleMode}
        handleImportClick={handleImportClick}
        handleExport={handleExport}
        handleMergeTracks={handleMergeTracks}
        handleFadeIn={handleFadeIn}
        handleFadeOut={handleFadeOut}
        handlePlay={handlePlay}
        handlePause={handlePause}
        handleStop={handleStop}
      />

      <FileInput ref={fileInputRef} onChange={handleFileChange} />

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
        <div className="flex-grow-1 overflow-auto" style={{ display: "flex", flexDirection: "column" }}>
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
