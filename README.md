# React Video Editor 🎬

**English** | [한국어](./README.ko.md)

A React-based video editor that lets you arrange images, videos, text, and audio on a timeline to edit videos, with the goal of automatically generating videos from edited templates.

## ✨ Key Features

- 🎥 **Powered by Remotion Player**: High-quality video rendering
- 🎛️ **Multi-track Timeline**: Complex editing with a layer system
- 📁 **Media Library**: Upload and manage image, video, and audio files
- ✂️ **Drag & Drop**: Intuitive clip placement and movement
- 🎨 **Text Editing**: Various text styles and animations
- 🔄 **Real-time Preview**: See results instantly
- 💾 **Project Saving**: Save and load your work

## 🚀 Quick Start

### 1. Basic Run (Recommended)

```bash
# Move into the project directory
cd react-video-editor

# Grant execution permission (only needed once)
chmod +x start_fullstack.sh

# Start the full-stack server
./start_fullstack.sh
```

### 2. Manual Run

```bash
# Install dependencies
npm install

# Run the dev server (frontend + backend)
npm run dev

# Or run them individually
npm run dev:client    # Frontend only
npm run dev:server    # Backend only
```

## 🔧 Port Configuration

### Automatic Port Detection
The script automatically reads the ports from the `.env` file:

```env
VITE_PORT=3004          # Frontend port
VITE_BACKEND_PORT=5002  # Backend port
```

### Changing Ports

```bash
# Run the port-change helper script
chmod +x change_ports.sh
./change_ports.sh
```

Or edit the `.env` file directly:

```env
# Change to the ports you want
VITE_PORT=8080
VITE_BACKEND_PORT=8081
VITE_API_URL=http://localhost:8081
```

Restart the server after changing:
```bash
./start_fullstack.sh
```

## 📂 Project Structure

```
react-video-editor/
├── src/                          # Frontend source
│   ├── components/               # React components
│   │   ├── player/              # Video player
│   │   ├── timeline/            # Timeline-related
│   │   └── properties/          # Property editing panel
│   ├── remotion/                # Remotion compositions
│   ├── store/                   # State management (Zustand)
│   └── types/                   # TypeScript type definitions
├── server/                      # Backend (Express)
│   ├── index.ts                 # Server main file
│   ├── uploads/                 # Uploaded files
│   └── projects/                # Saved projects
├── start_fullstack.sh           # Full-stack run script
├── change_ports.sh              # Port-change helper
└── .env                         # Environment variable settings
```

## 🛠️ Development Guide

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Video Engine**: Remotion 4.0
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Drag & Drop**: React DnD
- **Backend**: Express + TypeScript
- **File Upload**: Multer

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_PORT` | 3004 | Frontend port |
| `VITE_BACKEND_PORT` | 5002 | Backend port |
| `VITE_API_URL` | http://localhost:5002 | API server URL |
| `NODE_ENV` | development | Runtime environment |

### Script Commands

| Command | Description |
|---------|-------------|
| `./start_fullstack.sh` | Run the full-stack server (recommended) |
| `./change_ports.sh` | Change port settings |
| `npm run dev` | Run the dev server |
| `npm run dev:client` | Run frontend only |
| `npm run dev:server` | Run backend only |
| `npm run build` | Production build |
| `npm run remotion:dev` | Remotion Studio |

## 🎯 Usage

### 1. Upload Media
- Click the "Upload Files" button on the left
- Select image, video, or audio files
- Drag & drop is also supported

### 2. Timeline Editing
- Drag uploaded media onto the timeline
- Drag clips to adjust their position
- Drag clip edges to adjust their length
- Multi-select: Ctrl/Cmd + click

### 3. Add Text
- Click the "Add Text" button
- Drag text onto the timeline
- Edit the text in the right-side property panel

### 4. Save Project
- Click the save button when done
- Enter a project name
- Load it later to keep editing

## 🔍 Debugging

Detailed debugging information is shown in development mode:

- **Player area**: Real-time track/clip info
- **Browser console**: Detailed logs (F12 → Console)
- **VideoComposition**: Clip rendering status

If you run into problems, please check the browser console.

## 🚨 Troubleshooting

### Port Conflicts
```bash
# Check port usage
lsof -i :3004
lsof -i :5002

# Force kill the process
./start_fullstack.sh  # Automatically kills existing processes
```

### CORS Errors
- Check the port settings in the `.env` file
- Make sure the backend allows the frontend port
- Restart with `start_fullstack.sh`

### Blank Video Player Screen
- Check for errors in the browser console
- Make sure a clip has been added to the timeline
- Make sure the current time is within the clip's range

## 📄 License

This project was created for development and learning purposes.

## 🤝 Contributing

Please file bug reports or feature suggestions as issues.

---

**Happy Video Editing! 🎬✨**
