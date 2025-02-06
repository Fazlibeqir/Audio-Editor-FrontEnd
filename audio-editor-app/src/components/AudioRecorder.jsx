import React, { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import "bootstrap/dist/css/bootstrap.min.css";

const AudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const waveformRef = useRef(null);
  const waveSurferRef = useRef(null);
  const audioContextRef = useRef(null);
  const fileInputRef = useRef(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(1);

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();

    waveSurferRef.current = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: "cyan",
      progressColor: "blue",
      height: 250,
      responsive: true,
      backend: "WebAudio",
      barWidth: 3,
      audioContext: audioContextRef.current,
    });

    return () => {
      waveSurferRef.current.destroy();
      audioContextRef.current.close();
    };
  }, []);

  const handleRecord = async () => {
    if (!isRecording) {
      await audioContextRef.current.resume();
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        setMediaRecorder(recorder);

        const chunks = [];
        recorder.ondataavailable = (event) => chunks.push(event.data);

        recorder.onstop = () => {
          const audioBlob = new Blob(chunks, { type: "audio/webm" });
          setAudioBlob(audioBlob);
          waveSurferRef.current.loadBlob(audioBlob);
        };

        recorder.start();
        setIsRecording(true);
      } catch (error) {
        console.error("Error accessing microphone:", error);
      }
    } else {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const handleImportClick = () => fileInputRef.current.click();

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const fileUrl = URL.createObjectURL(file);
      waveSurferRef.current.load(fileUrl);
    }
  };

  const handleExport = () => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "recording.webm";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handlePlaybackRateChange = (event) => {
    const rate = parseFloat(event.target.value);
    setPlaybackRate(rate);
    waveSurferRef.current.setPlaybackRate(rate);
  };

  const handleVolumeChange = (event) => {
    const vol = parseFloat(event.target.value);
    setVolume(vol);
    waveSurferRef.current.setVolume(vol);
  };

  return (
    <div className="d-flex flex-column vh-100 bg-black text-white">
      
      {/* 🔹 Top Menu Bar */}
      <div className="d-flex bg-dark p-2">
        
        {/* 📁 File Dropdown */}
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

        {/* ✏️ Edit Dropdown */}
        <div className="dropdown me-3">
          <button className="btn btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
            Edit
          </button>
          <ul className="dropdown-menu">
            <li>
              <button className="dropdown-item" onClick={() => waveSurferRef.current.playPause()}>
                Play/Pause
              </button>
            </li>
            <li>
              <button className="dropdown-item" onClick={() => waveSurferRef.current.stop()}>
                Stop
              </button>
            </li>
          </ul>
        </div>

        {/* 🎚️ Controls */}
        <div className="d-flex align-items-center ms-auto">
          <label className="me-2">Speed:</label>
          <input type="range" min="0.5" max="2" step="0.1" value={playbackRate} onChange={handlePlaybackRateChange} />
          <label className="ms-3 me-2">Volume:</label>
          <input type="range" min="0" max="1" step="0.1" value={volume} onChange={handleVolumeChange} />
        </div>

        {/* Hidden File Input */}
        <input type="file" ref={fileInputRef} style={{ display: "none" }} onChange={handleFileChange} />
      </div>

      {/* 🔹 Main Layout */}
      <div className="d-flex flex-grow-1">
        
        {/* 🎛️ Sidebar */}
        <div className="d-flex flex-column align-items-center justify-content-center p-3 bg-dark vh-100" style={{ width: "80px", gap: "1.5rem" }}>
          <button className="btn btn-secondary" onClick={() => waveSurferRef.current.playPause()}>▶⏸</button>
          <button className="btn btn-secondary" onClick={() => waveSurferRef.current.stop()}>⏹</button>
          <button className={`btn ${isRecording ? "btn-danger" : "btn-secondary"} rounded-circle`} style={{ width: "50px", height: "50px" }} onClick={handleRecord}>
            <i className="bi bi-mic-fill"></i>
          </button>
          <button className="btn btn-warning">✂</button>
          <button className="btn btn-success" onClick={handleExport}>💾</button>
        </div>

        {/* 🔊 Waveform Display */}
        <div className="container d-flex justify-content-center align-items-center flex-grow-1">
          <div ref={waveformRef} className="border border-secondary p-2" style={{ width: "90%", height: "300px" }}></div>
        </div>

      </div>
    </div>
  );
};

export default AudioRecorder;
