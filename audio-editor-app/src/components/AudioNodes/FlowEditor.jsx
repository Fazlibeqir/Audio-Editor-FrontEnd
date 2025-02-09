import React, { useState, useCallback, useRef } from "react";
import  { ReactFlow,
  addEdge,
  MiniMap,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  Handle,
} from "@xyflow/react";
import { Plus, Download, ZoomIn, ZoomOut, Expand, Move, Trash2 } from "lucide-react";
import "@xyflow/react/dist/style.css";

/** Custom Node Components for Audio Editing **/

// Audio Input Node: Allows user to specify an input file or URL.
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
      {/* This node only has an output handle */}
      <Handle type="source" position="bottom" isConnectable={isConnectable} />
      <div style={{ fontWeight: "bold", color: "#1E90FF", marginBottom: 5 }}>
        Audio Input
      </div>
      <input
        type="file"
        accept="audio/*"
        onChange={(e) => data.onFileChange(e.target.files[0])}
        style={{ width: "100%", fontSize: "12px" }}
      />
    </div>
  );
};

// Audio Trim Node: Lets user set start time and duration.
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
      {/* Has both an input and an output handle */}
      <Handle type="target" position="top" isConnectable={isConnectable} />
      <Handle type="source" position="bottom" isConnectable={isConnectable} />
      <div style={{ fontWeight: "bold", color: "#FFA500", marginBottom: 5 }}>
        Trim Audio
      </div>
      <div style={{ fontSize: "12px" }}>
        <label>Start:</label>
        <input
          type="text"
          value={data.start || ""}
          onChange={(e) => data.onChangeStart(e.target.value)}
          placeholder="00:00:00"
          style={{ width: "70px", marginLeft: 3 }}
        />
      </div>
      <div style={{ fontSize: "12px", marginTop: 5 }}>
        <label>Duration:</label>
        <input
          type="text"
          value={data.duration || ""}
          onChange={(e) => data.onChangeDuration(e.target.value)}
          placeholder="secs"
          style={{ width: "70px", marginLeft: 3 }}
        />
      </div>
    </div>
  );
};
/** Merge Node - Combines Two Inputs **/
const AudioMergeNode = ({ id, data, isConnectable }) => {
  return (
    <div
      style={{
        padding: 10,
        border: "2px solidrgb(207, 12, 165)",
        borderRadius: 5,
        background: "#E6FFE6",
        width: "150px",
      }}
    >
      <Handle type="target" position="top" isConnectable={isConnectable} id="a" />
      <Handle type="target" position="top" isConnectable={isConnectable} id="b" />
      <Handle type="source" position="bottom" isConnectable={isConnectable} />
      <div className="node-title">Merge Audio</div>
      <p style={{ fontSize: "12px", color: "#555" }}>Combines two audio files</p>
    </div>
  );
};

// Audio Effect Node: Provides a simple dropdown to choose an effect.
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
      <div style={{ fontWeight: "bold", color: "#32CD32", marginBottom: 5 }}>
        Audio Effect
      </div>
      <div style={{ fontSize: "12px" }}>
        <label>Effect:</label>
        <select
          value={data.effect || "none"}
          onChange={(e) => data.onChangeEffect(e.target.value)}
          style={{ fontSize: "12px", marginLeft: 3 }}
        >
          <option value="none">None</option>
          <option value="reverb">Reverb</option>
          <option value="echo">Echo</option>
          <option value="chorus">Chorus</option>
        </select>
      </div>
    </div>
  );
};

// Audio Output Node: Lets user specify an output file.
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
      <div style={{ fontWeight: "bold", color: "#DC143C", marginBottom: 5 }}>
        Audio Output
      </div>
      <input
        type="text"
        value={data.label || ""}
        onChange={(e) => data.onChange(e.target.value)}
        placeholder="Output file"
        style={{ width: "100%", fontSize: "12px" }}
      />
      {audioUrl && (
        <>
          <audio controls src={audioUrl} style={{ width: "100%", marginTop: "10px" }} />
          <button onClick={() => new Audio(audioUrl).play()} className="btn btn-secondary mt-2">
            Preview
          </button>
          <a href={audioUrl} download={data.label || "output.mp3"} className="btn btn-primary mt-2">
            Download
          </a>
        </>
      )}
    </div>
  );
};

/** Main Audio Flow Editor Component **/

export default function AudioFlowEditor({ toggleMode }) {
  // We start with an empty array for nodes and edges.
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const nodeIdCounter = useRef(1);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [isInteractive, setIsInteractive] = useState(true);
  const [minimapViewport, setMinimapViewport] = useState({ x: 0, y: 0, zoom: 1 });

  // Handlers for node and edge updates.
  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );
  const onConnect = useCallback(
    (connection) => setEdges((eds) => addEdge({ ...connection, animated: true }, eds)),
    []
  );
  const onEdgeContextMenu = (event, edge) => {
    event.preventDefault();
    setEdges((eds) => eds.filter((e) => e.id !== edge.id));
  };

  // Helper to update a node’s data.
  const updateNodeData = (id, newData) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, ...newData } } : node
      )
    );
  };

  // Function to add a new node of a specified type.
  const addNode = (type) => {
    const id = String(nodeIdCounter.current++);
    const newNode = {
      id,
      type, // Must match one of the keys in our nodeTypes map
      position: { x: Math.random() * 300 + 50, y: Math.random() * 300 + 50 },
      data: {},
    };

    // Initialize default data and change handlers per node type.
    if (type === "audioInput") {
      newNode.data = {
        label: "Input File",
        onFileChange: (file) => updateNodeData(id, { file }),
      };
    } else if (type === "audioTrim") {
      newNode.data = {
        start: "00:00:00",
        duration: "10",
        onChangeStart: (value) => updateNodeData(id, { start: value }),
        onChangeDuration: (value) => updateNodeData(id, { duration: value }),
      };
    } else if (type === "audioEffect") {
      newNode.data = {
        effect: "none",
        onChangeEffect: (value) => updateNodeData(id, { effect: value }),
      };
    } else if (type === "audioOutput") {
      newNode.data = {
        label: "Output File",
        onChange: (value) => updateNodeData(id, { label: value }),
        file: null,
      };
    }

    setNodes((nds) => [...nds, newNode]);
  };

  // Handle recording audio
  const handleRecord = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    const chunks = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };

    mediaRecorder.onstop = () => {
      const newAudioBlob = new Blob(chunks, { type: "audio/webm" });
      const id = String(nodeIdCounter.current++);
      const newNode = {
        id,
        type: "audioInput",
        position: { x: Math.random() * 300 + 50, y: Math.random() * 300 + 50 },
        data: { file: newAudioBlob },
      };
      setNodes((nds) => [...nds, newNode]);
    };

    mediaRecorder.start();
    setTimeout(() => mediaRecorder.stop(), 5000); // Record for 5 seconds
  };
  

  // Zoom and fit view controls
  const zoomIn = () => reactFlowInstance?.zoomIn();
  const zoomOut = () => reactFlowInstance?.zoomOut();
  const fitView = () => reactFlowInstance?.fitView();
  const toggleInteractive = () => setIsInteractive(true);

  // Map node types to our custom node components.
  const nodeTypes = {
    audioInput: AudioInputNode,
    audioTrim: AudioTrimNode,
    audioMerge: AudioMergeNode,
    audioEffect: AudioEffectNode,
    audioOutput: AudioOutputNode,
  };

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        className="d-flex bg-dark p-2 justify-content-between align-items-center"
        style={{ height: "50px", flexShrink: 0 }}
      >
        <div style={{ color: "white", fontSize: "18px" }}>
          Audio Editing Flow Editor
        </div>
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
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onEdgeContextMenu={onEdgeContextMenu}
          onInit={setReactFlowInstance}
          fitView
          nodesDraggable={isInteractive}
          elementsSelectable={isInteractive}
        >
          <Controls />
          <MiniMap
            style={{
              position: "absolute",
              top: "350px",
              right: "10px",
            }}
            viewportPosition={minimapViewport}
          />
          <Background variant="dots" gap={12} size={1} />
        </ReactFlow>

        {/* Left-Side Controls */}
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
          <button className="react-flow__controls-button" onClick={toggleInteractive}>
            <Move size={16} />
          </button>
        </div>

        {/* Bottom Center Controls: Buttons to add nodes and export workflow */}
        <div style={buttonContainerStyle}>
          <button onClick={() => addNode("audioInput")} style={customButtonStyle}>
            <Plus size={18} /> Add Input
          </button>
          <button onClick={() => addNode("audioTrim")} style={customButtonStyle}>
            <Plus size={18} /> Add Trim
          </button>
          <button onClick={() => addNode("audioEffect")} style={customButtonStyle}>
            <Plus size={18} /> Add Effect
          </button>
          <button onClick={() => addNode("audioOutput")} style={customButtonStyle}>
            <Plus size={18} /> Add Output
          </button>
          {/* <button onClick={exportWorkflow} style={customButtonStyle}>
            <Download size={18} /> Export
          </button> */}
        </div>
      </div>
    </div>
  );
}

/** Styles for controls and buttons **/
const controlsContainerStyle = {
  position: "absolute",
  left: 15,
  top: "50%",
  transform: "translateY(-50%)",
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