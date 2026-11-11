import { networkInterfaces } from 'os';
import { Socket } from 'net';

const RTSP_PORT = 554;

function localSubnet(): string | null {
	for (const list of Object.values(networkInterfaces())) {
		for (const a of list ?? []) {
			if (a.family === 'IPv4' && !a.internal) {
				return a.address.split('.').slice(0, 3).join('.');
			}
		}
	}
	return null;
}

// Considera "câmera" qualquer IP com a porta RTSP aberta
function probe(ip: string, timeout = 400): Promise<string | null> {
	return new Promise((res) => {
		const s = new Socket();
		s.setTimeout(timeout);
		s.once('connect', () => {
			s.destroy();
			res(ip);
		});
		s.once('timeout', () => {
			s.destroy();
			res(null);
		});
		s.once('error', () => {
			s.destroy();
			res(null);
		});
		s.connect(RTSP_PORT, ip);
	});
}

export async function scanLocalNetwork(): Promise<string[]> {
	const base = localSubnet();
	if (!base) return [];
	const ips = Array.from({ length: 254 }, (_, i) => `${base}.${i + 1}`);
	const found: string[] = [];
	for (let i = 0; i < ips.length; i += 50) {
		const results = await Promise.all(ips.slice(i, i + 50).map((ip) => probe(ip)));
		found.push(...results.filter((r): r is string => !!r));
	}
	return found;
}
