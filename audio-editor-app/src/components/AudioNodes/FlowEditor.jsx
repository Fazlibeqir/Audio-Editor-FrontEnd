import React, { useState, useCallback, useRef } from "react";
import {
  ReactFlow,
  addEdge,
  MiniMap,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  Handle,
} from "@xyflow/react";
import { Plus, Download, ZoomIn, ZoomOut, Expand, Move } from "lucide-react"; // Icons
import "@xyflow/react/dist/style.css";

// Custom node with editable text
const CustomNode = ({ id, data, isConnectable }) => {
  const [label, setLabel] = useState(data.label);

  const handleChange = (e) => {
    setLabel(e.target.value);
  };

  return (
    <div
      style={{
        padding: 10,
        border: "1px solid black",
        borderRadius: 5,
        background: "#f8f8f8",
      }}
    >
      <Handle type="target" position="top" isConnectable={isConnectable} />
      <input
        type="text"
        value={label}
        onChange={handleChange}
        style={{
          width: "100px",
          textAlign: "center",
          border: "none",
          background: "transparent",
          fontSize: "14px",
          color: "black",
        }}
      />
      <Handle type="source" position="bottom" isConnectable={isConnectable} />
    </div>
  );
};

const initialNodes = [
  { id: "1", type: "custom", data: { label: "New Node" }, position: { x: 100, y: 50 } },
];
const initialEdges = [];

export default function FlowEditor({ toggleMode }) {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const nodeIdCounter = useRef(2); // Persistent counter without re-renders
  const [reactFlowInstance, setReactFlowInstance] = useState(null); // For zoom & fit view
  const [isInteractive, setIsInteractive] = useState(true); // Interactive mode toggle
  const [minimapViewport, setMinimapViewport] = useState({ x: 0, y: 0, zoom: 1 });

  // Handle node position changes
  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  // Handle edge (connection) changes
  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  // More responsive connections
  const onConnect = useCallback(
    (connection) => setEdges((eds) => addEdge({ ...connection, animated: true }, eds)),
    []
  );

  // Function to add a new node dynamically
  const addNode = () => {
    const firstNode = nodes[0];
    const lastNode = nodes[nodes.length - 1];
    const offset = 20;

    const newNode = {
      id: String(nodeIdCounter.current++),
      type: "custom",
      data: { label: "New Node" },
      position: {
        x: firstNode ? firstNode.position.x : 100,
        y: lastNode ? lastNode.position.y + offset : firstNode.position.y + offset,
      },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  // Function to export the current workflow as JSON
  const exportWorkflow = () => {
    const workflowData = { nodes, edges };
    console.log("Exported Workflow:", JSON.stringify(workflowData, null, 2));
    alert("Check console for exported JSON");
  };

  // Zoom & Fit Controls
  const zoomIn = () => reactFlowInstance?.zoomIn();
  const zoomOut = () => reactFlowInstance?.zoomOut();
  const fitView = () => reactFlowInstance?.fitView();

  // Toggle Interactive Mode
  const toggleInteractive = () => setIsInteractive(true);

  const onMove = useCallback((event, viewport) => {
    setMinimapViewport({
      x: viewport.x,
      y: viewport.y,
      zoom: viewport.zoom, // Keep track of zoom level as well
    });
  }, []);

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header with Toggle Mode Button */}
      <div
        className="d-flex bg-dark p-2 justify-content-between align-items-center"
        style={{ height: "50px", flexShrink: 0 }}
      >
        <div style={{ color: "white", fontSize: "18px" }}>Flow Editor</div>
        <button className="btn btn-primary" onClick={toggleMode}>
          Toggle Mode
        </button>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, position: "relative" }}>
        <ReactFlow
          style={{ width: "100%", height: "100%" }}
          nodes={nodes}
          edges={edges}
          nodeTypes={{ custom: CustomNode }}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onMove={onMove}
          onInit={setReactFlowInstance} // Store flow instance
          fitView
          nodesDraggable={isInteractive} // Toggle draggable mode
          elementsSelectable={isInteractive} // Toggle selection mode
        >
          <Controls />
          <MiniMap
            style={{
              position: "absolute",
              top: "350px",
              right: "10px",
            }}
            viewportPosition={minimapViewport} // Pass the viewport position
          />
          <Background variant="dots" gap={12} size={1} />
        </ReactFlow>

        {/* Center-Left Controls */}
        <div style={controlsContainerStyle}>
          <button className="react-flow__controls-button" onClick={zoomIn}>
            <ZoomIn size={16} />
          </button>
          <button className="react-flow__controls-button" onClick={zoomOut}>
            <ZoomOut size={16} />
          </button>
          <button className="react-flow__controls-button" onClick={fitView}>
            <Expand size={16} />
          </button>
          <button className={`react-flow__controls-button`} onClick={toggleInteractive}>
            <Move size={16} />
          </button>
        </div>

        {/* Bottom Center UI */}
        <div style={buttonContainerStyle}>
          <button onClick={addNode} style={customButtonStyle}>
            <Plus size={18} /> Add Node
          </button>
          <button onClick={exportWorkflow} style={customButtonStyle}>
            <Download size={18} /> Export
          </button>
        </div>
      </div>
    </div>
  );
}

// Styles for controls and buttons
const controlsContainerStyle = {
  position: "absolute",
  left: 15, // Stay on the left side
  top: "50%", // Center vertically
  transform: "translateY(-50%)", // Ensure perfect centering
  display: "flex",
  flexDirection: "column",
  gap: "5px",
};

const buttonContainerStyle = {
  position: "absolute",
  bottom: 15,
  left: "50%",
  transform: "translateX(-50%)",
  display: "flex",
  gap: "10px",
  padding: "10px",
};

const customButtonStyle = {
  display: "flex",
  alignItems: "center",
  gap: "5px",
  padding: "8px 12px",
  border: "none",
  borderRadius: "5px",
  background: "#007bff",
  color: "white",
  cursor: "pointer",
  fontSize: "14px",
};
