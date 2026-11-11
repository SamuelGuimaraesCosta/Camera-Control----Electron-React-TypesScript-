import { contextBridge, ipcRenderer } from 'electron';
import type { CameraInput } from '../shared/types';

const api = {
	cameras: {
		list: () => ipcRenderer.invoke('cameras:list'),
		create: (data: CameraInput) => ipcRenderer.invoke('cameras:create', data),
		update: (id: string, data: Partial<CameraInput>) =>
			ipcRenderer.invoke('cameras:update', id, data),
		remove: (id: string) => ipcRenderer.invoke('cameras:remove', id),
		whep: (id: string, sdp: string) =>
			ipcRenderer.invoke('webrtc:whep', id, sdp) as Promise<string>
	},
	scan: () => ipcRenderer.invoke('scan:network') as Promise<string[]>
};

contextBridge.exposeInMainWorld('api', api);
export type Api = typeof api;
