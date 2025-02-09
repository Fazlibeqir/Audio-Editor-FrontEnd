import { bufferToBlob } from './audioUtils';

export async function trimAudio(blob, region, audioContext) {
  const { start, end } = region;
  const arrayBuffer = await blob.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  const sampleRate = audioBuffer.sampleRate;
  const startSample = Math.floor(start * sampleRate);
  const endSample = Math.floor(end * sampleRate);
  const trimmedBuffer = audioContext.createBuffer(
    audioBuffer.numberOfChannels,
    endSample - startSample,
    sampleRate
  );
  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const oldData = audioBuffer.getChannelData(channel);
    const newData = trimmedBuffer.getChannelData(channel);
    newData.set(oldData.slice(startSample, endSample));
  }
  const offlineContext = new OfflineAudioContext(
    trimmedBuffer.numberOfChannels,
    trimmedBuffer.length,
    sampleRate
  );
  const source = offlineContext.createBufferSource();
  source.buffer = trimmedBuffer;
  source.connect(offlineContext.destination);
  source.start();
  const renderedBuffer = await offlineContext.startRendering();
  return bufferToBlob(renderedBuffer);
}

export async function applyFadeIn(blob, audioContext, fadeDuration = 1) {
  const arrayBuffer = await blob.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  const sampleRate = audioBuffer.sampleRate;
  const fadeSamples = Math.floor(fadeDuration * sampleRate);
  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const channelData = audioBuffer.getChannelData(channel);
    for (let i = 0; i < fadeSamples && i < channelData.length; i++) {
      channelData[i] *= i / fadeSamples;
    }
  }
  return bufferToBlob(audioBuffer);
}

export async function applyFadeOut(blob, audioContext, fadeDuration = 1) {
  const arrayBuffer = await blob.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  const sampleRate = audioBuffer.sampleRate;
  const fadeSamples = Math.floor(fadeDuration * sampleRate);
  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const channelData = audioBuffer.getChannelData(channel);
    for (let i = 0; i < fadeSamples && i < channelData.length; i++) {
      const index = channelData.length - i - 1;
      channelData[index] *= i / fadeSamples;
    }
  }
  return bufferToBlob(audioBuffer);
}