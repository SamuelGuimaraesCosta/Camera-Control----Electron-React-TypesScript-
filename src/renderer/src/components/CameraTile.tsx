import { JSX, useEffect, useRef, useState } from 'react';
import type { Camera } from '../../../shared/types';

interface Props {
	cam: Camera;
	onDoubleClick?: () => void;
}

// Espera a coleta de candidatos ICE, com limite de 2 s
const waitIce = (pc: RTCPeerConnection): Promise<void> =>
	new Promise<void>((resolve) => {
		if (pc.iceGatheringState === 'complete') return resolve();
		const done = (): void => {
			if (pc.iceGatheringState === 'complete') {
				pc.removeEventListener('icegatheringstatechange', done);
				resolve();
			}
		};
		pc.addEventListener('icegatheringstatechange', done);
		setTimeout(resolve, 2000);
	});

export default function CameraTile({ cam, onDoubleClick }: Props): JSX.Element {
	const videoRef = useRef<HTMLVideoElement>(null);
	const [status, setStatus] = useState<'connecting' | 'live' | 'error'>('connecting');

	useEffect(() => {
		const video = videoRef.current;
		if (!video) return;

		let closed = false;
		let pc: RTCPeerConnection | undefined;
		let retryTimer: number | undefined;

		const retry = (): void => {
			if (closed) return;
			setStatus('error');
			pc?.close();
			pc = undefined;
			clearTimeout(retryTimer);
			retryTimer = window.setTimeout(connect, 3000);
		};

		const connect = async (): Promise<void> => {
			if (closed) return;
			setStatus('connecting');

			const conn = new RTCPeerConnection();
			pc = conn;
			conn.addTransceiver('video', { direction: 'recvonly' });
			conn.ontrack = (e) => {
				video.srcObject = e.streams[0];
				video.play().catch(() => {});
			};
			conn.onconnectionstatechange = () => {
				if (conn.connectionState === 'connected') setStatus('live');
				if (conn.connectionState === 'failed' || conn.connectionState === 'disconnected')
					retry();
			};

			try {
				const offer = await conn.createOffer();
				await conn.setLocalDescription(offer);
				await waitIce(conn);

				const answer = await window.api.cameras.whep(cam.id, conn.localDescription!.sdp);
				await conn.setRemoteDescription({ type: 'answer', sdp: answer });
			} catch {
				retry();
			}
		};

		connect();

		return () => {
			closed = true;
			clearTimeout(retryTimer);
			pc?.close();
			video.srcObject = null;
		};
	}, [cam.id]);

	return (
		<div className="tile" onDoubleClick={onDoubleClick}>
			<video ref={videoRef} muted autoPlay playsInline />
			<div className="overlay">
				<span>{cam.name}</span>
				<span className={`badge ${status}`}>
					{status === 'live'
						? 'ao vivo'
						: status === 'error'
							? 'sem sinal'
							: 'conectando'}
				</span>
			</div>
		</div>
	);
}
