import { app, BrowserWindow, ipcMain } from 'electron';
import { electronApp, optimizer } from '@electron-toolkit/utils';
import {
	listCameras,
	createCamera,
	updateCamera,
	removeCamera,
	getCameraWithSecret
} from './cameraStore';
import { applyCameras, stopAllStreams } from './streamManager';
import { scanLocalNetwork } from './scanner';
import type { CameraInput } from '../shared/types';
import { join } from 'path';

const syncStreams = (): void => applyCameras(listCameras().map((c) => getCameraWithSecret(c.id)));

app.whenReady().then(() => {
	electronApp.setAppUserModelId('com.samuel.costa.camera.control');
	app.on('browser-window-created', (_, w) => optimizer.watchWindowShortcuts(w));

	ipcMain.handle('webrtc:whep', async (_, id: string, sdp: string) => {
		if (!/^[\w-]+$/.test(id)) throw new Error('id inválido');
		const res = await fetch(`http://127.0.0.1:8889/${id}/whep`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/sdp' },
			body: sdp
		});
		if (!res.ok) throw new Error(`WHEP ${res.status}`);
		return res.text();
	});

	ipcMain.handle('cameras:list', () => listCameras());
	ipcMain.handle('cameras:create', (_, data: CameraInput) => {
		createCamera(data);
		syncStreams();
	});
	ipcMain.handle('cameras:update', (_, id: string, data: Partial<CameraInput>) => {
		updateCamera(id, data);
		syncStreams();
	});
	ipcMain.handle('cameras:remove', (_, id: string) => {
		removeCamera(id);
		syncStreams();
	});
	ipcMain.handle('scan:network', () => scanLocalNetwork());

	syncStreams();
	createWindow();
	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});

app.on('before-quit', stopAllStreams);
app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') app.quit();
});

function createWindow(): void {
	const window = new BrowserWindow({
		width: 900,
		height: 670,
		show: false,
		autoHideMenuBar: true,
		webPreferences: {
			preload: join(__dirname, '../preload/index.js'),
			sandbox: false
		}
	});

	window.once('ready-to-show', () => window.show());

	const rendererUrl = process.env.ELECTRON_RENDERER_URL;
	if (rendererUrl) {
		void window.loadURL(rendererUrl);
	} else {
		void window.loadFile(join(__dirname, '../renderer/index.html'));
	}
}
