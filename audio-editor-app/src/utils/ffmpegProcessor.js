import { fetchFile } from "@ffmpeg/ffmpeg";

export async function processWorkflow({ nodes, ffmpeg, ffmpegLoaded, timeStrToSeconds }) {
  if (!ffmpegLoaded) {
    throw new Error("FFmpeg is not loaded yet!");
  }

  // Gather the required nodes
  const mergeNode = nodes.find((node) => node.type === "audioMerge");
  const trimNode = nodes.find((node) => node.type === "audioTrim");
  const effectNode = nodes.find((node) => node.type === "audioEffect");
  const outputNode = nodes.find((node) => node.type === "audioOutput");

  if (!outputNode) {
    throw new Error("Make sure you have an Audio Output node.");
  }

  let currentFile = null;

  // If a merge node exists, merge available audio sources.
  if (mergeNode) {
    const mergingSources = nodes.filter(
      (node) =>
        (node.type === "audioInput" || node.type === "audioRecord") &&
        node.data.file
    );
    if (mergingSources.length < 2) {
      throw new Error("Merging requires at least two audio sources.");
    }
    
    for (let i = 0; i < mergingSources.length; i++) {
      await ffmpeg.FS(
        "writeFile",
        `input${i}.mp3`,
        await fetchFile(mergingSources[i].data.file)
      );
    }
    
    // Create a file list for the concat demuxer.
    // Each line should be of the form: file 'inputX.mp3'
    let fileListContent = "";
    for (let i = 0; i < mergingSources.length; i++) {
      fileListContent += `file 'input${i}.mp3'\n`;
    }
    await ffmpeg.FS("writeFile", "fileList.txt", fileListContent);
    
    // Run ffmpeg with the concat demuxer to merge the audio files.
    await ffmpeg.run(
      "-f", "concat",
      "-safe", "0",
      "-i", "fileList.txt",
      "-c", "copy",
      "merged.mp3"
    );
    
    // Read the merged file from ffmpeg's FS and create a Blob.
    const mergedData = ffmpeg.FS("readFile", "merged.mp3");
    currentFile = new Blob([mergedData.buffer], { type: "audio/mp3" });
    
    // Clean up temporary files from the FS.
    for (let i = 0; i < mergingSources.length; i++) {
      ffmpeg.FS("unlink", `input${i}.mp3`);
    }
    ffmpeg.FS("unlink", "fileList.txt");
    ffmpeg.FS("unlink", "merged.mp3");
  } else {
    // If no merge node, try to get a single source.
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
      throw new Error("No audio source found.");
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
        throw new Error(
          "Fade out effect requires a trim node to compute audio duration."
        );
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

  // Return an object with the output node id and processed file.
  return { outputNodeId: outputNode.id, file: currentFile };
}
