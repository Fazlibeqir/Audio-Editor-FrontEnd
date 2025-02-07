import React, { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.js"; // Import Regions Plugin
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
  const [region, setRegion] = useState(null); // Store selected region

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
      plugins: [RegionsPlugin.create()], // Enable Regions plugin
    });

    // Listen for region updates
    waveSurferRef.current.on("region-created", (region) => {
      setRegion(region);
    });

    return () => {
      waveSurferRef.current.destroy();
      audioContextRef.current.close();
    };
  }, []);
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
      
      // Store the imported file as a Blob for exporting later
      const reader = new FileReader();
      reader.readAsArrayBuffer(file);
      reader.onloadend = () => {
        const audioBlob = new Blob([reader.result], { type: file.type });
        setAudioBlob(audioBlob);
      };
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
  const applyFadeIn = async () => {
    if (!audioBlob) return;
  
    const audioBuffer = await audioContextRef.current.decodeAudioData(await audioBlob.arrayBuffer());
    const fadeDuration = 1; // 1 second fade-in
    const sampleRate = audioBuffer.sampleRate;
    const fadeSamples = Math.floor(fadeDuration * sampleRate);
  
    for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
      const channelData = audioBuffer.getChannelData(i);
  
      for (let j = 0; j < fadeSamples && j < channelData.length; j++) {
        channelData[j] *= j / fadeSamples;
      }
    }
  
    const fadedBlob = await bufferToBlob(audioBuffer);
    setAudioBlob(fadedBlob);
    waveSurferRef.current.loadBlob(fadedBlob);
  };
  
  const applyFadeOut = async () => {
    if (!audioBlob) return;
  
    const audioBuffer = await audioContextRef.current.decodeAudioData(await audioBlob.arrayBuffer());
    const fadeDuration = 1; // 1 second fade-out
    const sampleRate = audioBuffer.sampleRate;
    const fadeSamples = Math.floor(fadeDuration * sampleRate);
  
    for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
      const channelData = audioBuffer.getChannelData(i);
  
      for (let j = 0; j < fadeSamples && j < channelData.length; j++) {
        const index = channelData.length - j - 1;
        channelData[index] *= j / fadeSamples;
      }
    }
  
    const fadedBlob = await bufferToBlob(audioBuffer);
    setAudioBlob(fadedBlob);
    waveSurferRef.current.loadBlob(fadedBlob);
  };

  const handleTrim = async () => {
    if (!region || !audioBlob) return;

    // Get the selected region's start and end times
    const { start, end } = region;
    const audioBuffer = await audioContextRef.current.decodeAudioData(await audioBlob.arrayBuffer());

    // Calculate the portion to keep
    const sampleRate = audioBuffer.sampleRate;
    const startSample = Math.floor(start * sampleRate);
    const endSample = Math.floor(end * sampleRate);

    // Create a new buffer with the trimmed selection
    const trimmedBuffer = audioContextRef.current.createBuffer(
      audioBuffer.numberOfChannels,
      endSample - startSample,
      sampleRate
    );

    for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
      const oldData = audioBuffer.getChannelData(i);
      const newData = trimmedBuffer.getChannelData(i);
      newData.set(oldData.slice(startSample, endSample));
    }

    // Convert trimmed buffer to Blob
    const offlineContext = new OfflineAudioContext(
      trimmedBuffer.numberOfChannels,
      trimmedBuffer.length,
      trimmedBuffer.sampleRate
    );

    const source = offlineContext.createBufferSource();
    source.buffer = trimmedBuffer;
    source.connect(offlineContext.destination);
    source.start();

    const renderedBuffer = await offlineContext.startRendering();
    const trimmedBlob = await bufferToBlob(renderedBuffer);

    setAudioBlob(trimmedBlob);
    waveSurferRef.current.loadBlob(trimmedBlob);
  };

  const bufferToBlob = async (audioBuffer) => {
    const wavBuffer = await encodeWav(audioBuffer);
    return new Blob([wavBuffer], { type: "audio/wav" });
  };

  const encodeWav = async (audioBuffer) => {
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const length = audioBuffer.length * numChannels * 2 + 44;
    const buffer = new ArrayBuffer(length);
    const view = new DataView(buffer);

    function writeString(offset, str) {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    }

    function writeInt16(offset, value) {
      view.setInt16(offset, value, true);
    }

    writeString(0, "RIFF");
    view.setUint32(4, 36 + audioBuffer.length * numChannels * 2, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * 2, true);
    view.setUint16(32, numChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, "data");
    view.setUint32(40, audioBuffer.length * numChannels * 2, true);

    for (let i = 0; i < numChannels; i++) {
      const data = audioBuffer.getChannelData(i);
      let offset = 44;
      for (let j = 0; j < data.length; j++, offset += 2) {
        writeInt16(offset, data[j] * 0x7fff);
      }
    }

    return buffer;
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
         {/* Effects */}
         <div className="dropdown me-3">
          <button className="btn btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
            Effects
          </button>
          <ul className="dropdown-menu">
            <li>
              <button className="dropdown-item" onClick={applyFadeIn}>
                FadeIn
              </button>
            </li>
            <li>
              <button className="dropdown-item" onClick={applyFadeOut}>
                FadeOut
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
          <button className="btn btn-secondary" onClick={() => waveSurferRef.current.playPause()}>
            ▶⏸
          </button>
          <button className="btn btn-secondary" onClick={() => waveSurferRef.current.stop()}>
            ⏹
          </button>
          <button className={`btn ${isRecording ? "btn-danger" : "btn-secondary"} rounded-circle`} style={{ width: "50px", height: "50px" }} onClick={handleRecord}>
            <i className="bi bi-mic-fill"></i>
          </button>
          <button className="btn btn-warning" onClick={handleTrim}>
            ✂
          </button>
          <button className="btn btn-success" onClick={handleExport}>
            💾
          </button>
        </div>

        {/* 🔊 Waveform Display */}
        <div className="container d-flex justify-content-center align-items-center flex-grow-1">
          <div ref={waveformRef} className="border border-secondary p-2" style={{ width: "90%", height: "300px" }}></div>
          {/* <label>Start Trim</label>
          <input type="number" value={startTrim} onChange={(e) => setStartTrim(parseFloat(e.target.value))} />
          <label>End Trim</label>
          <input type="number" value={endTrim} onChange={(e) => setEndTrim(parseFloat(e.target.value))} /> */}
        </div>
      </div>
    </div>
  );
};

export default AudioRecorder;
