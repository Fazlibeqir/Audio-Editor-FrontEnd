import React from "react";
import {Handle} from "@xyflow/react";

// Audio Trim Node – Allows the user to set the start time and duration for trimming.
const AudioTrimNode = ({ id, data, isConnectable }) => {
    return (
      <div
        style={{
          padding: 10,
          border: "2px solid #FFA500",
          borderRadius: 5,
          background: "#FFF7E6",
          width: "150px",
        }}
      >
        <Handle type="target" position="top" isConnectable={isConnectable} />
        <Handle type="source" position="bottom" isConnectable={isConnectable} />
        <div
          style={{
            fontWeight: "bold",
            color: "#FFA500",
            marginBottom: 5,
            textAlign: "center",
          }}
        >
          Trim Audio
        </div>
        <div style={{ fontSize: "12px", marginBottom: "5px" }}>
          <label>Start:</label>
          <input
            type="text"
            value={data.start || ""}
            onChange={(e) =>
              data.onChangeStart && data.onChangeStart(e.target.value)
            }
            placeholder="00:00:00"
            style={{ width: "70px", marginLeft: 3 }}
          />
        </div>
        <div style={{ fontSize: "12px" }}>
          <label>Duration:</label>
          <input
            type="text"
            value={data.duration || ""}
            onChange={(e) =>
              data.onChangeDuration && data.onChangeDuration(e.target.value)
            }
            placeholder="secs"
            style={{ width: "70px", marginLeft: 3 }}
          />
        </div>
      </div>
    );
  };

  export default AudioTrimNode;