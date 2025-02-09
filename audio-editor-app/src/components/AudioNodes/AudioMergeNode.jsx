import React from "react";
import {Handle} from "@xyflow/react";

// Audio Merge Node – Indicates that multiple audio sources should be merged.
const AudioMergeNode = ({ id, data, isConnectable }) => {
    return (
      <div
        style={{
          padding: 10,
          border: "2px solid #9932CC",
          borderRadius: 5,
          background: "#F3E5F5",
          width: "150px",
        }}
      >
        {/* Two target handles (for at least two inputs) and one source handle */}
        <Handle type="target" position="top" isConnectable={isConnectable} id="a" />
        <Handle type="target" position="top" isConnectable={isConnectable} id="b" />
        <Handle type="source" position="bottom" isConnectable={isConnectable} />
        <div
          style={{
            fontWeight: "bold",
            color: "#9932CC",
            marginBottom: 5,
            textAlign: "center",
          }}
        >
          Merge Audio
        </div>
        <div style={{ fontSize: "12px", textAlign: "center" }}>
          Merges multiple audio sources
        </div>
      </div>
    );
  };

  export default AudioMergeNode;