import React, { useState } from 'react';

const RecordButton = ({ audioContext, addOrUpdateTrack }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);

  const handleRecord = async () => {
    if (!isRecording) {
      await audioContext.current.resume();
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        setMediaRecorder(recorder);
        const chunks = [];
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };
        recorder.onstop = () => {
          const newAudioBlob = new Blob(chunks, { type: 'audio/webm' });
          addOrUpdateTrack(newAudioBlob, 'record');
        };
        recorder.start();
        setIsRecording(true);
      } catch (error) {
        console.error("Error accessing microphone:", error);
      }
    } else {
      if (mediaRecorder) {
        mediaRecorder.stop();
        setIsRecording(false);
      }
    }
  };

  return (
    <button
      type="button"
      className={`btn ${isRecording ? 'btn-danger' : 'btn-primary'} rounded-circle`}
      style={{
        width: '60px',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.9rem'
      }}
      onClick={handleRecord}
    >
      {isRecording ? 'Stop' : 'Rec'}
    </button>
  );
};

export default RecordButton;
