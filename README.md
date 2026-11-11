# Camera Control

A desktop application for managing and monitoring RTSP cameras on your local network. Camera Control uses [MediaMTX](https://github.com/bluenviron/mediamtx) to relay camera streams to a low-latency WebRTC dashboard.

## Features

- View multiple live camera feeds in a configurable 1–4 column dashboard.
- Add, edit, and remove cameras with an RTSP address, path, and optional credentials.
- Scan the local subnet for devices with the default RTSP port (554) open, then add discovered addresses.
- Hide individual cameras from the dashboard, maximize a feed, or open it in fullscreen.
- Enable audio per camera when its RTSP stream includes an audio track.
- Store camera settings locally; camera passwords are protected using Electron's secure storage.

> Network discovery checks whether port 554 is open. It does not verify that a device is a camera or that its stream credentials are valid.

## How streaming works

Most cameras expose video over RTSP, which browsers cannot play directly. Camera Control starts the bundled MediaMTX process, pulls each camera's RTSP stream on demand, and presents it to the app over WebRTC/WHEP.

The app generates MediaMTX configuration in its Electron user-data directory. It uses the local WHEP endpoint on port `8889` and WebRTC media on UDP port `8189`. Keep these ports available on the computer running the app, and make sure that computer can reach the cameras over the network.

Camera feeds start muted. Use **Ativar áudio** on a feed with an audio track to listen; audio support depends on the camera's RTSP stream.

## Requirements

- Windows (the included MediaMTX executable and current runtime path are Windows-specific).
- Node.js and npm for development and building.
- RTSP-enabled cameras reachable from the computer. You will need each camera's IP address, RTSP port, stream path, and—if configured—username and password.

> Build scripts for macOS and Linux are present, but the application currently looks specifically for `mediamtx.exe`. Those platforms require a matching MediaMTX binary and a platform-aware executable path before the packaged app can run there.

## MediaMTX: required runtime

MediaMTX is required both when running the app from source and in the packaged application. This repository includes the Windows executable at `resources/bin/mediamtx.exe`; Electron Builder copies `resources/bin` into the packaged app's resources.

If the executable is missing, or you need a different build:

1. Download the appropriate MediaMTX release from the [official releases page](https://github.com/bluenviron/mediamtx/releases).
2. Extract the Windows executable from the archive.
3. Place it at **`resources/bin/mediamtx.exe`**, replacing the existing file if needed.
4. Keep the upstream `LICENSE` file in `resources/bin` when redistributing MediaMTX.
5. Build or start the application as described below.

The app launches MediaMTX for you; you do not need to start it separately. Camera Control writes its active MediaMTX configuration to the app's user-data directory, so the bundled `resources/bin/mediamtx.yml` is not the runtime configuration to edit.

## Development

Install dependencies from the lockfile and start the Electron/Vite development app:

```powershell
npm ci
npm run dev
```

To run the TypeScript checks:

```powershell
npm run typecheck
```

To run ESLint:

```powershell
npm run lint
```

## Build

Create a Windows portable application:

```powershell
npm run build:win
```

The packaged output is written to `dist/`. The Windows target is configured as a portable executable; no separate MediaMTX installation is needed when the bundled executable is present.

Other packaging scripts are available:

```powershell
npm run build:mac
npm run build:linux
```

These commands do not make the current MediaMTX integration cross-platform; see the platform note in [Requirements](#requirements).

For a development build without packaging an installer/application bundle:

```powershell
npm run build
```

## Adding a camera

1. Start Camera Control and open **Câmeras**.
2. Select **+ Nova câmera**, or use **Buscar na rede** to discover addresses with RTSP port 554 open.
3. Enter a name, IP address, RTSP port, and stream path (for example, `/stream1`).
4. Enter the camera's username and password if required, then save.
5. Open **Dashboard** to view the feed. A camera may take a moment to connect.

The camera's RTSP path and credentials vary by manufacturer. Check the camera documentation if the default port or stream path does not work.

## Local data and troubleshooting

- Camera records are stored in Electron's user-data directory in `cameras.json`.
- The generated MediaMTX configuration and log are stored alongside the app's user data as `mediamtx.yml` and `mediamtx.log`.
- If MediaMTX does not start, confirm `resources/bin/mediamtx.exe` exists before launching the app and check `mediamtx.log`.
- If a feed does not connect, confirm the camera is reachable, its RTSP port and path are correct, and its credentials are valid. Also check that local ports `8889` and UDP `8189` are available.
- Network discovery only checks port 554. Cameras using a different RTSP port can still be added manually.

## Tech stack

- Electron
- React
- TypeScript
- electron-vite
- MediaMTX
