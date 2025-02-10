import React, {useState} from "react";
import {Handle} from "@xyflow/react";

// Audio Record Node – Allows the user to record voice (5 seconds) via the microphone.
const AudioRecordNode = ({ id, data, isConnectable }) => {
    const [recording, setRecording] = useState(false);
    const [error, setError] = useState(null);
  
    const handleRecord = async () => {
      setRecording(true);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        const chunks = [];
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data);
          }
        };
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: "audio/webm" });
          data.onRecord && data.onRecord(blob);
          setRecording(false);
        };
        mediaRecorder.start();
        setTimeout(() => {
          mediaRecorder.stop();
        }, 5000); // record for 5 seconds
      } catch (err) {
        setError("Recording failed");
        setRecording(false);
      }
    };
  
    const audioUrl = data.file ? URL.createObjectURL(data.file) : null;
  
    return (
      <div
        style={{
          padding: 10,
          border: "2px solid #8A2BE2",
          borderRadius: 5,
          background: "#E6E6FA",
          width: "150px",
        }}
      >
        <Handle type="target" position="top" isConnectable={isConnectable} />
        <Handle type="source" position="bottom" isConnectable={isConnectable} />
        <div
          style={{
            fontWeight: "bold",
            color: "#8A2BE2",
            marginBottom: 5,
            textAlign: "center",
          }}
        >
          Record Audio
        </div>
        <button
          onClick={handleRecord}
          disabled={recording}
          style={{ width: "100%", fontSize: "12px" }}
        >
          {recording ? "Recording..." : "Record 5 sec"}
        </button>
        {error && (
          <div style={{ color: "red", fontSize: "10px", textAlign: "center" }}>
            {error}
          </div>
        )}
        {audioUrl && (
          <>
            <audio controls src={audioUrl} style={{ width: "100%", marginTop: "10px" }} />
            <a
              href={audioUrl}
              download="recording.webm"
              style={{
                marginTop: "10px",
                display: "block",
                textAlign: "center",
                fontSize: "12px",
              }}
            >
              Download
            </a>
          </>
        )}
      </div>
    );
  };
 
  export default AudioRecordNode;