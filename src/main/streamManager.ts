import { spawn, ChildProcess } from 'child_process';
import { app } from 'electron';
import { join } from 'path';
import { appendFileSync, writeFileSync } from 'fs';
import type { CameraWithSecret } from './cameraStore';

const BIN = app.isPackaged
	? join(process.resourcesPath, 'bin', 'mediamtx.exe')
	: join(app.getAppPath(), 'resources', 'bin', 'mediamtx.exe');
const CONF = join(app.getPath('userData'), 'mediamtx.yml');
const LOG = join(app.getPath('userData'), 'mediamtx.log');
const log = (msg: string): void => {
	console.log('[mediamtx]', msg);
	appendFileSync(LOG, `${new Date().toISOString()} ${msg}\n`);
};

let proc: ChildProcess | undefined;
let lastConfig = '';

function rtspUrl(c: CameraWithSecret): string {
	const auth = c.username
		? `${encodeURIComponent(c.username)}:${encodeURIComponent(c.password ?? '')}@`
		: '';
	const path = c.path.startsWith('/') ? c.path : `/${c.path}`;
	return `rtsp://${auth}${c.ip}:${c.port}${path}`;
}

function buildConfig(cams: CameraWithSecret[]): string {
	const paths = cams
		.map(
			(c) =>
				`  ${c.id}:\n` +
				`    source: ${JSON.stringify(rtspUrl(c))}\n` +
				`    sourceOnDemand: yes\n` +
				`    rtspTransport: tcp`
		)
		.join('\n');

	return [
		'logLevel: info',
		'api: no',
		'rtsp: no',
		'rtmp: no',
		'srt: no',
		'hls: no',
		'moq: no',
		'playback: no',
		'metrics: no',
		'pprof: no',
		'webrtc: yes',
		'webrtcAddress: 127.0.0.1:8889',
		'webrtcLocalUDPAddress: :8189',
		"webrtcAllowOrigins: ['*']",
		'paths:',
		paths || '  {}'
	].join('\n');
}

function start(): void {
	log(`iniciando: ${BIN}`);
	const p = spawn(BIN, [CONF], { windowsHide: true });
	proc = p;
	p.stdout?.on('data', (d) => log(d.toString().trim()));
	p.stderr?.on('data', (d) => log('ERRO ' + d.toString().trim()));
	p.on('error', (err) => {
		log('falha ao iniciar: ' + err.message);
		if (proc === p) proc = undefined;
	});
	p.on('exit', (code) => {
		log(`saiu com código ${code}`);
		if (proc === p) proc = undefined;
	});
}

// Reescreve a configuração e reinicia o MediaMTX só se algo mudou
export function applyCameras(cams: CameraWithSecret[]): void {
	const config = buildConfig(cams);
	if (proc && config === lastConfig) return;

	lastConfig = config;
	writeFileSync(CONF, config);

	const old = proc;
	proc = undefined;
	if (old) {
		// espera o processo antigo morrer para liberar a porta 8889
		old.once('exit', start);
		old.kill();
	} else {
		start();
	}
}

export function stopAllStreams(): void {
	proc?.kill();
	proc = undefined;
	lastConfig = '';
}
