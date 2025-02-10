import React from "react";
import {Handle} from "@xyflow/react";

// Audio Effect Node – Provides a dropdown to choose an effect and (if needed) set a fade duration.
const AudioEffectNode = ({ id, data, isConnectable }) => {
    return (
      <div
        style={{
          padding: 10,
          border: "2px solid #32CD32",
          borderRadius: 5,
          background: "#E6FFE6",
          width: "150px",
        }}
      >
        <Handle type="target" position="top" isConnectable={isConnectable} />
        <Handle type="source" position="bottom" isConnectable={isConnectable} />
        <div
          style={{
            fontWeight: "bold",
            color: "#32CD32",
            marginBottom: 5,
            textAlign: "center",
          }}
        >
          Audio Effect
        </div>
        <div style={{ fontSize: "12px" }}>
          <label>Effect:</label>
          <select
            value={data.effect || "none"}
            onChange={(e) =>
              data.onChangeEffect && data.onChangeEffect(e.target.value)
            }
            style={{ marginLeft: 3, fontSize: "12px" }}
          >
            <option value="none">None</option>
            <option value="fadeIn">Fade In</option>
            <option value="fadeOut">Fade Out</option>
            <option value="echo">Echo</option>
            <option value="reverb">Reverb</option>
          </select>
        </div>
        {(data.effect === "fadeIn" || data.effect === "fadeOut") && (
          <div style={{ fontSize: "12px", marginTop: 5 }}>
            <label>Duration:</label>
            <input
              type="text"
              value={data.fadeDuration || ""}
              onChange={(e) =>
                data.onChangeFadeDuration && data.onChangeFadeDuration(e.target.value)
              }
              placeholder="secs"
              style={{ width: "70px", marginLeft: 3 }}
            />
          </div>
        )}
      </div>
    );
  };

  export default AudioEffectNode;