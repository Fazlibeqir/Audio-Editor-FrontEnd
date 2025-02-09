import React from "react";
import {Handle} from "@xyflow/react";

// Audio Input Node – Allows the user to upload an audio file.
const AudioInputNode = ({ id, data, isConnectable }) => {
    return (
      <div
        style={{
          padding: 10,
          border: "2px solid #1E90FF",
          borderRadius: 5,
          background: "#E6F7FF",
          width: "150px",
        }}
      >
        {/* Only an output handle */}
        <Handle type="source" position="bottom" isConnectable={isConnectable} />
        <div
          style={{
            fontWeight: "bold",
            color: "#1E90FF",
            marginBottom: 5,
            textAlign: "center",
          }}
        >
          Audio Input
        </div>
        <input
          type="file"
          accept="audio/*"
          onChange={(e) =>
            data.onFileChange && data.onFileChange(e.target.files[0])
          }
          style={{ width: "100%", fontSize: "12px" }}
        />
      </div>
    );
  };

  export default AudioInputNode;