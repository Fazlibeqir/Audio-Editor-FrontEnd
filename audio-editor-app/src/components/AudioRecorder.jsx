import React, { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import "bootstrap/dist/css/bootstrap.min.css";

const AudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const waveformRef = useRef(null);
  const waveSurferRef = useRef(null);
  const audioContextRef = useRef(null);

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();

    waveSurferRef.current = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: "cyan",
      progressColor: "blue",
      height: 150,
      responsive: true,
      backend: "WebAudio",
      barWidth: 3,
      audioContext: audioContextRef.current, // Ensure AudioContext is controlled
    });

    return () => {
      waveSurferRef.current.destroy();
      audioContextRef.current.close();
    };
  }, []);

  const handleRecord = async () => {
    if (!isRecording) {
      await audioContextRef.current.resume(); // Fix for AudioContext autoplay policy
      setAudioChunks([]);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        setMediaRecorder(recorder);

        const chunks = [];
        recorder.ondataavailable = (event) => {
          chunks.push(event.data);
        };

        recorder.onstop = () => {
          const audioBlob = new Blob(chunks, { type: "audio/webm" });
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

  return (
    <div className="d-flex vh-100 bg-black text-white">
      {/* Sidebar Buttons */}
      <div className="d-flex flex-column align-items-center p-3 bg-dark" style={{ width: "80px" }}>
        <button className="btn btn-secondary my-2" onClick={() => waveSurferRef.current.playPause()}>
          ▶⏸
        </button>
        <button className="btn btn-secondary my-2" onClick={() => waveSurferRef.current.stop()}>
          ⏹
        </button>
        <button
          type="button"
          className={`btn ${isRecording ? "btn-danger" : "btn-secondary"} rounded-circle d-flex justify-content-center align-items-center`}
          style={{ width: "50px", height: "50px" }}
          onClick={handleRecord}
        >
          <i className="bi bi-mic-fill"></i>
        </button>
        <button className="btn btn-warning my-2">✂</button>
        <button className="btn btn-success my-2">💾</button>
      </div>

      {/* Main Content - Waveform */}
      <div className="container d-flex justify-content-center align-items-center flex-grow-1">
        <div ref={waveformRef} className="border border-secondary p-2" style={{ width: "90%", height: "300px" }}></div>
      </div>
    </div>
  );
};

export default AudioRecorder;
