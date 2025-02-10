# Audio-Editor-FrontEnd
This project is the front-end part of the Audio Editor application. It is built with **React** and **Vite** to provide a modern, responsive user interface for audio editing. 
It communicates with the BackEnd service (built with Java Spring Boot) to process audio files using **FFmpeg**.

## Features

- **Modern React UI:** Fast development with Vite.
- **Node Editing:** Integrated with @xyflow/react.
- **Audio Visualization:** Real-time waveform display using wavesurfer.js.
- **Processing audio:**  FFmpeg
- **Seamless Integration:** Communicates with the Spring Boot backend for audio processing.

## Team

- **Andi Zahiri** - 191560
- **Beqir Fazli** - 191045
- **Venhar Ademi** - 201501

## Getting Started

### Prerequisites

- Node.js (v20+ recommended)
- npm 

### Installation

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/Fazlibeqir/Audio-Editor-FrontEnd.git
   cd Audio-Editor-rontend/audio-editor-app
   ```
2. Install Dependencies
   ```bash
   npm install
   ```
   if that doesn't install all the dependencies install those manually:
   ```bash
   npm install @xyflow/react boostrap lucide-react @ffmpeg/ffmpeg
   ```
## Running the Application
   ```bash
   npm run dev
   ```
  This will launch the app on http://localhost:3000 or you can check it out the hosted with vercel https://audio-editor-app.vercel.app
## Configuration
- API Endpoints: Make sure the backend server is running. Update the API endpoint URLs in the project configuration (if needed) to match your backend’s address.
- Customization: For further customization, refer to the Vite and React documentation.
## Technologies Used
- React
- Vite
- @xyflow/react
- wavesurfer.js
## Contributing
Contributions are welcome! Please fork this repository and submit a pull request with your improvements.
