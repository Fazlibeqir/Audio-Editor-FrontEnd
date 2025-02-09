import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  ReactFlow,
  addEdge,
  MiniMap,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
} from "@xyflow/react"; // or "reactflow" if using that package
import {
  Plus,
  ZoomIn,
  ZoomOut,
  Expand,
  Move,
} from "lucide-react";

//TODO: Refactorize on more files

import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";
import AudioInputNode from "./AudioInputNode";
import AudioRecordNode from "./AudioRecordNode";
import AudioTrimNode from "./AudioTrimNode";
import AudioEffectNode from "./AudioEffectNode";
import AudioMergeNode from "./AudioMergeNode";
import AudioOutputNode from "./AudioOutputNode";
import {controlsContainerStyle, buttonContainerStyle, customButtonStyle} from "./ButtonStyle";

/** Main Component **/

export default function AudioFlowEditor({ toggleMode }) {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const nodeIdCounter = useRef(1);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [isInteractive, setIsInteractive] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false); // Processing state

  // ffmpeg state
  const [ffmpeg, setFFmpeg] = useState(null);
  const [ffmpegLoaded, setFFmpegLoaded] = useState(false);

  // Load ffmpeg.wasm once on mount
  useEffect(() => {
    const loadFFmpeg = async () => {
      const ffmpegInstance = createFFmpeg({ log: true });
      await ffmpegInstance.load();
      setFFmpeg(ffmpegInstance);
      setFFmpegLoaded(true);
    };
    loadFFmpeg();
  }, []);

  // React Flow event handlers.
  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );
  const onConnect = useCallback(
    (connection) =>
      setEdges((eds) => addEdge({ ...connection, animated: true }, eds)),
    []
  );

  // Context menu handlers for deletion of nodes and edges.
  const onNodeContextMenu = (event, node) => {
    event.preventDefault();
    if (window.confirm(`Delete node ${node.id}?`)) {
      setNodes((nds) => nds.filter((n) => n.id !== node.id));
    }
  };

  const onEdgeContextMenu = (event, edge) => {
    event.preventDefault();
    if (window.confirm(`Delete edge ${edge.id}?`)) {
      setEdges((eds) => eds.filter((e) => e.id !== edge.id));
    }
  };

  // Helper to update a node’s data.
  const updateNodeData = (id, newData) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, ...newData } } : node
      )
    );
  };

  // Helper to convert "HH:MM:SS" to seconds.
  const timeStrToSeconds = (timeStr) => {
    const parts = timeStr.split(":").map(Number);
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return 0;
  };

  // Function to add a new node of a specified type.
  const addNode = (type) => {
    const id = String(nodeIdCounter.current++);
    const newNode = {
      id,
      type, // Must match one of the keys in our nodeTypes map.
      position: { x: Math.random() * 300 + 50, y: Math.random() * 300 + 50 },
      data: {},
    };

    if (type === "audioInput") {
      newNode.data = {
        label: "Input File",
        onFileChange: (file) => updateNodeData(id, { file }),
      };
    } else if (type === "audioRecord") {
      newNode.data = {
        label: "Record Audio",
        onRecord: (file) => updateNodeData(id, { file }),
      };
    } else if (type === "audioMerge") {
      newNode.data = {
        label: "Merge Audio",
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
        fadeDuration: "5",
        onChangeEffect: (value) => updateNodeData(id, { effect: value }),
        onChangeFadeDuration: (value) =>
          updateNodeData(id, { fadeDuration: value }),
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

  // ffmpeg processing function – processes merging, trimming, and effects.
  const processWorkflow = async () => {
    if (!ffmpegLoaded) {
      alert("FFmpeg is not loaded yet!");
      return;
    }

    setIsProcessing(true); // Disable process button while processing

    // Gather nodes:
    const mergeNode = nodes.find((node) => node.type === "audioMerge");
    const trimNode = nodes.find((node) => node.type === "audioTrim");
    const effectNode = nodes.find((node) => node.type === "audioEffect");
    const outputNode = nodes.find((node) => node.type === "audioOutput");

    if (!outputNode) {
      alert("Make sure you have an Audio Output node.");
      setIsProcessing(false);
      return;
    }

    let currentFile = null;

    try {
      // If a merge node exists, merge all available audio sources.
      if (mergeNode) {
        // Gather all audioInput and audioRecord nodes that have a file.
        const mergingSources = nodes.filter(
          (node) =>
            (node.type === "audioInput" || node.type === "audioRecord") &&
            node.data.file
        );
        if (mergingSources.length < 2) {
          alert("Merging requires at least two audio sources.");
          setIsProcessing(false);
          return;
        }
        // Write each file to ffmpeg's FS.
        for (let i = 0; i < mergingSources.length; i++) {
          await ffmpeg.FS(
            "writeFile",
            `input${i}.mp3`,
            await fetchFile(mergingSources[i].data.file)
          );
        }
        // Build input arguments.
        const inputArgs = [];
        for (let i = 0; i < mergingSources.length; i++) {
          inputArgs.push("-i", `input${i}.mp3`);
        }
        const filter = `amix=inputs=${mergingSources.length}:duration=longest`;
        await ffmpeg.run(...inputArgs, "-filter_complex", filter, "merged.mp3");
        const mergedData = ffmpeg.FS("readFile", "merged.mp3");
        currentFile = new Blob([mergedData.buffer], { type: "audio/mp3" });
        // Cleanup merging files.
        for (let i = 0; i < mergingSources.length; i++) {
          ffmpeg.FS("unlink", `input${i}.mp3`);
        }
        ffmpeg.FS("unlink", "merged.mp3");
      } else {
        // If no merge node, try to get a single source (prefer an audioInput, then an audioRecord).
        const inputNode = nodes.find(
          (node) => node.type === "audioInput" && node.data.file
        );
        const recordNodes = nodes.filter(
          (node) => node.type === "audioRecord" && node.data.file
        );
        if (inputNode) {
          currentFile = inputNode.data.file;
        } else if (recordNodes.length > 0) {
          currentFile = recordNodes[0].data.file;
        } else {
          alert("No audio source found.");
          setIsProcessing(false);
          return;
        }
      }

      // If a trim node exists, apply trimming.
      if (trimNode) {
        const startSec = timeStrToSeconds(trimNode.data.start);
        const duration = trimNode.data.duration;
        await ffmpeg.FS("writeFile", "temp.mp3", await fetchFile(currentFile));
        await ffmpeg.run(
          "-i",
          "temp.mp3",
          "-ss",
          String(startSec),
          "-t",
          String(duration),
          "-c",
          "copy",
          "trimmed.mp3"
        );
        const trimmedData = ffmpeg.FS("readFile", "trimmed.mp3");
        currentFile = new Blob([trimmedData.buffer], { type: "audio/mp3" });
        ffmpeg.FS("unlink", "temp.mp3");
        ffmpeg.FS("unlink", "trimmed.mp3");
      }

      // If an effect node exists, apply the chosen effect.
      if (effectNode) {
        let filterStr = "";
        if (effectNode.data.effect === "fadeIn") {
          filterStr = `afade=t=in:st=0:d=${effectNode.data.fadeDuration}`;
        } else if (effectNode.data.effect === "fadeOut") {
          if (trimNode) {
            const trimDuration = Number(trimNode.data.duration);
            const fadeDuration = Number(effectNode.data.fadeDuration);
            filterStr = `afade=t=out:st=${trimDuration - fadeDuration}:d=${fadeDuration}`;
          } else {
            alert("Fade out effect requires a trim node to compute audio duration.");
            setIsProcessing(false);
            return;
          }
        } else if (effectNode.data.effect === "echo") {
          filterStr = `aecho=0.8:0.88:60:0.4`;
        } else if (effectNode.data.effect === "reverb") {
          filterStr = `aecho=0.7:0.9:1000:0.3`;
        }
        if (filterStr) {
          await ffmpeg.FS("writeFile", "temp.mp3", await fetchFile(currentFile));
          await ffmpeg.run("-i", "temp.mp3", "-af", filterStr, "effect.mp3");
          const effectData = ffmpeg.FS("readFile", "effect.mp3");
          currentFile = new Blob([effectData.buffer], { type: "audio/mp3" });
          ffmpeg.FS("unlink", "temp.mp3");
          ffmpeg.FS("unlink", "effect.mp3");
        }
      }

      // Update the output node with the final processed file.
      updateNodeData(outputNode.id, { file: currentFile });
    } catch (error) {
      console.error("Error processing audio with ffmpeg:", error);
      alert("Audio processing failed. Check console for details.");
    } finally {
      setIsProcessing(false); // Re-enable the process button
    }
  };

  // Zoom and view controls.
  const zoomIn = () => reactFlowInstance?.zoomIn();
  const zoomOut = () => reactFlowInstance?.zoomOut();
  const fitView = () => reactFlowInstance?.fitView();
  const toggleInteractive = () => setIsInteractive((prev) => !prev);

  // Map node types to custom components.
  const nodeTypes = {
    audioInput: AudioInputNode,
    audioRecord: AudioRecordNode,
    audioMerge: AudioMergeNode,
    audioTrim: AudioTrimNode,
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
          onNodeContextMenu={onNodeContextMenu}
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

        {/* Bottom Center Controls: Buttons to add nodes */}
        <div style={buttonContainerStyle}>
          <button onClick={() => addNode("audioInput")} style={customButtonStyle}>
            <Plus size={18} /> Add Input
          </button>
          <button onClick={() => addNode("audioRecord")} style={customButtonStyle}>
            <Plus size={18} /> Add Record
          </button>
          <button onClick={() => addNode("audioMerge")} style={customButtonStyle}>
            <Plus size={18} /> Add Merge
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
        </div>

        {/* Process Workflow Button */}
        <button
          onClick={processWorkflow}
          disabled={isProcessing}
          style={{
            position: "absolute",
            bottom: 80,
            left: "50%",
            transform: "translateX(-50%)",
            padding: "10px 20px",
            backgroundColor: isProcessing ? "#6c757d" : "#28a745",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: isProcessing ? "not-allowed" : "pointer",
          }}
        >
          {isProcessing ? "Processing..." : "Process Audio"}
        </button>
      </div>
    </div>
  );
}