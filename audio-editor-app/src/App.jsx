// App.jsx
import { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import AudioRecorder from './components/AudioRecorder/AudioRecorder';
import FlowEditor from './components/AudioNodes/FlowEditor';

function App() {
  const [mode, setMode] = useState('audio'); // 'audio' or 'flow'

  const toggleMode = () => {
    setMode(prevMode => (prevMode === 'audio' ? 'flow' : 'audio'));
  };

  return (
    <div className="bg-dark">
      {mode === 'audio' ? (
        <AudioRecorder toggleMode={toggleMode} />
      ) : (
        <FlowEditor toggleMode={toggleMode} />
      )}
    </div>
  );
}

export default App;
