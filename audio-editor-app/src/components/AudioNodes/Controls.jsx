import React from "react";
import { Plus, ZoomIn, ZoomOut, Expand, Move } from "lucide-react";

export default function Controls({
  zoomIn,
  zoomOut,
  fitView,
  toggleInteractive,
  addNode,
  processWorkflow,
  isProcessing,
}) {
  return (
    <>
      {/* Left-Side Controls */}
      <div
        style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <button className="btn btn-outline-light" onClick={zoomIn}>
          <ZoomIn size={16} />
        </button>
        <button className="btn btn-outline-light" onClick={zoomOut}>
          <ZoomOut size={16} />
        </button>
        <button className="btn btn-outline-light" onClick={fitView}>
          <Expand size={16} />
        </button>
        <button className="btn btn-outline-light" onClick={toggleInteractive}>
          <Move size={16} />
        </button>
      </div>

      {/* Bottom Center Controls: Add Node Buttons */}
      <div
        style={{
          position: "absolute",
          bottom: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: "10px",
        }}
      >
        <button
          className="btn btn-outline-light"
          onClick={() => addNode("audioInput")}
        >
          <Plus size={18} /> Add Input
        </button>
        <button
          className="btn btn-outline-light"
          onClick={() => addNode("audioRecord")}
        >
          <Plus size={18} /> Add Record
        </button>
        <button
          className="btn btn-outline-light"
          onClick={() => addNode("audioMerge")}
        >
          <Plus size={18} /> Add Merge
        </button>
        <button
          className="btn btn-outline-light"
          onClick={() => addNode("audioTrim")}
        >
          <Plus size={18} /> Add Trim
        </button>
        <button
          className="btn btn-outline-light"
          onClick={() => addNode("audioEffect")}
        >
          <Plus size={15} /> Add Effect
        </button>
        <button
          className="btn btn-outline-light"
          onClick={() => addNode("audioOutput")}
        >
          <Plus size={18} /> Add Output
        </button>
      </div>

      {/* Process Workflow Button */}
      <button
        onClick={processWorkflow}
        disabled={isProcessing}
        className={`btn ${isProcessing ? "btn-secondary" : "btn-success"}`}
        style={{
          position: "absolute",
          bottom: "80px",
          left: "50%",
          transform: "translateX(-50%)",
        }}
      >
        {isProcessing ? "Processing..." : "Process Audio"}
      </button>
    </>
  );
}
