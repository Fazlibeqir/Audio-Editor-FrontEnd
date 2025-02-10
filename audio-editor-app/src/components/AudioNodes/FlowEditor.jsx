import React, { useState, useCallback, useRef, useEffect } from "react";
import  { ReactFlow,
  addEdge,
  MiniMap,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
} from "@xyflow/react";
import { createFFmpeg } from "@ffmpeg/ffmpeg";

import {controlsContainerStyle, buttonContainerStyle, customButtonStyle} from "./CustomNodes/ButtonStyle";//!!! DONT TOUCH THIS LINE

import Header from "./Header";
import Controls from "./Controls";

import AudioInputNode from "./CustomNodes/AudioInputNode";
import AudioRecordNode from "./CustomNodes/AudioRecordNode";
import AudioTrimNode from "./CustomNodes/AudioTrimNode";
import AudioEffectNode from "./CustomNodes/AudioEffectNode";
import AudioMergeNode from "./CustomNodes/AudioMergeNode";
import AudioOutputNode from "./CustomNodes/AudioOutputNode";

import { processWorkflow as processWorkflowUtil } from "../../utils/ffmpegProcessor";
import { timeStrToSeconds } from "../../utils/timeUtils";

export default function AudioFlowEditor({ toggleMode }) {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const nodeIdCounter = useRef(1);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [isInteractive, setIsInteractive] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // FFmpeg state
  const [ffmpeg, setFFmpeg] = useState(null);
  const [ffmpegLoaded, setFFmpegLoaded] = useState(false);

  // Load ffmpeg.wasm once on mount.
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

  // Context menu handlers.
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
        node.id === id
          ? { ...node, data: { ...node.data, ...newData } }
          : node
      )
    );
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

  // FFmpeg processing function – calls our utility.
  const processAudioWorkflow = async () => {
    setIsProcessing(true);
    try {
      const result = await processWorkflowUtil({
        nodes,
        ffmpeg,
        ffmpegLoaded,
        timeStrToSeconds,
      });
      // Update the output node with the final processed file.
      updateNodeData(result.outputNodeId, { file: result.file });
    } catch (error) {
      console.error("Error processing audio with ffmpeg:", error);
      alert(error.message);
    } finally {
      setIsProcessing(false);
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
      <Header toggleMode={toggleMode} />
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
          <MiniMap
            style={{ position: "absolute", top: "350px", right: "10px" }}
          />
          <Background variant="dots" gap={12} size={1} />
        </ReactFlow>
        <Controls
          zoomIn={zoomIn}
          zoomOut={zoomOut}
          fitView={fitView}
          toggleInteractive={toggleInteractive}
          addNode={addNode}
          processWorkflow={processAudioWorkflow}
          isProcessing={isProcessing}
        />
      </div>
    </div>
  );
}