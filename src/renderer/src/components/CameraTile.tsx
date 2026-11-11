import { JSX, useEffect, useRef, useState } from 'react';
import type { Camera } from '../../../shared/types';

interface Props {
	cam: Camera;
	onDoubleClick?: () => void;
	onMaximize?: () => void;
	isFocused?: boolean;
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

export default function CameraTile({ cam, onDoubleClick, onMaximize, isFocused = false }: Props): JSX.Element {
	const videoRef = useRef<HTMLVideoElement>(null);
	const tileRef = useRef<HTMLDivElement>(null);
	const [status, setStatus] = useState<'connecting' | 'live' | 'error'>('connecting');
	const [audioEnabled, setAudioEnabled] = useState(false);
	const [hasAudio, setHasAudio] = useState(false);
	const [isFullscreen, setIsFullscreen] = useState(false);
	const [actionError, setActionError] = useState('');

	useEffect(() => {
		const updateFullscreen = (): void => {
			setIsFullscreen(document.fullscreenElement === tileRef.current);
		};
		document.addEventListener('fullscreenchange', updateFullscreen);
		return () => document.removeEventListener('fullscreenchange', updateFullscreen);
	}, []);

	useEffect(() => {
		const video = videoRef.current;
		if (!video) return;

		let closed = false;
		let pc: RTCPeerConnection | undefined;
		let retryTimer: number | undefined;
		const remoteStream = new MediaStream();

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
			conn.addTransceiver('audio', { direction: 'recvonly' });
			conn.ontrack = (e) => {
				if (!remoteStream.getTracks().some((track) => track.id === e.track.id)) {
					remoteStream.addTrack(e.track);
				}
				video.srcObject = remoteStream;
				if (e.track.kind === 'audio') setHasAudio(true);
			};
			conn.onconnectionstatechange = () => {
				if (conn.connectionState === 'connected') setStatus('live');
				if (conn.connectionState === 'failed' || conn.connectionState === 'disconnected') retry();
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

	const toggleAudio = (): void => {
		const video = videoRef.current;
		if (!video) return;

		setActionError('');
		const enable = !audioEnabled;
		video.muted = !enable;
		setAudioEnabled(enable);
		if (enable) {
			video.play().catch(() => {
				video.muted = true;
				setAudioEnabled(false);
				setActionError('Não foi possível reproduzir o áudio.');
			});
		}
	};

	const toggleFullscreen = (): void => {
		const tile = tileRef.current;
		if (!tile) return;

		setActionError('');
		const action = document.fullscreenElement === tile ? document.exitFullscreen() : tile.requestFullscreen();
		action.catch(() => setActionError('Não foi possível abrir em tela cheia.'));
	};

	return (
		<div ref={tileRef} className={`tile${isFocused ? ' tile-focused' : ''}`} onDoubleClick={onDoubleClick}>
			<video ref={videoRef} muted autoPlay playsInline />
			<div className="overlay">
				<span>{cam.name}</span>
				<span className={`badge ${status}`}>{status === 'live' ? 'ao vivo' : status === 'error' ? 'sem sinal' : 'conectando'}</span>
			</div>
			<div className="tile-controls">
				{actionError && (
					<span className="tile-action-error" role="alert">
						{actionError}
					</span>
				)}
				<button
					type="button"
					disabled={!hasAudio}
					aria-label={hasAudio ? (audioEnabled ? 'Silenciar áudio' : 'Ativar áudio') : 'Áudio indisponível'}
					aria-pressed={audioEnabled}
					onClick={(event) => {
						event.stopPropagation();
						toggleAudio();
					}}
				>
					{hasAudio ? (audioEnabled ? 'Silenciar áudio' : 'Ativar áudio') : 'Sem áudio'}
				</button>
				{onMaximize && (
					<button
						type="button"
						onClick={(event) => {
							event.stopPropagation();
							onMaximize();
						}}
					>
						{isFocused ? 'Voltar ao grid' : 'Maximizar'}
					</button>
				)}
				<button
					type="button"
					aria-label={isFullscreen ? 'Sair da tela cheia' : 'Abrir em tela cheia'}
					onClick={(event) => {
						event.stopPropagation();
						toggleFullscreen();
					}}
				>
					{isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
				</button>
			</div>
		</div>
	);
}
