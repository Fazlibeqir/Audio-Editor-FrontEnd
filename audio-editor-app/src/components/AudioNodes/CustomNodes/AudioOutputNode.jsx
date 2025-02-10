import React from "react";
import {Handle} from "@xyflow/react";

// Audio Output Node – Displays an audio player, preview button, and download link.
const AudioOutputNode = ({ id, data, isConnectable }) => {
    const audioUrl = data.file ? URL.createObjectURL(data.file) : null;
    return (
      <div
        style={{
          padding: 10,
          border: "2px solid #DC143C",
          borderRadius: 5,
          background: "#FFE6E6",
          width: "150px",
        }}
      >
        <Handle type="target" position="top" isConnectable={isConnectable} />
        <div
          style={{
            fontWeight: "bold",
            color: "#DC143C",
            marginBottom: 5,
            textAlign: "center",
          }}
        >
          Audio Output
        </div>
        <input
          type="text"
          value={data.label || ""}
          onChange={(e) => data.onChange && data.onChange(e.target.value)}
          placeholder="Output file"
          style={{ width: "100%", fontSize: "12px" }}
        />
        {audioUrl && (
          <>
            <audio controls src={audioUrl} style={{ width: "100%", marginTop: "10px" }} />
            <button
              onClick={() => new Audio(audioUrl).play()}
              style={{
                marginTop: "10px",
                width: "100%",
                padding: "5px",
                fontSize: "12px",
              }}
            >
              Preview
            </button>
            <a
              href={audioUrl}
              download={data.label || "output.mp3"}
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

  export default AudioOutputNode;