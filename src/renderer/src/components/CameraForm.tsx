import { JSX, useState, type SubmitEvent } from 'react';
import type { Camera, CameraInput } from '../../../shared/types';

interface Props {
	camera?: Camera;
	initial?: Partial<CameraInput>;
	onDone: () => void;
}

export default function CameraForm({ camera, initial, onDone }: Props): JSX.Element {
	const [data, setData] = useState<CameraInput>({
		name: camera?.name ?? initial?.name ?? '',
		ip: camera?.ip ?? initial?.ip ?? '',
		port: camera?.port ?? initial?.port ?? 554,
		path: camera?.path ?? initial?.path ?? '/stream1',
		username: camera?.username ?? initial?.username ?? '',
		password: ''
	});

	const set = (k: keyof CameraInput, v: string | number): void =>
		setData((d) => ({ ...d, [k]: v }));

	const save = async (e: SubmitEvent): Promise<void> => {
		e.preventDefault();
		const payload = { ...data, port: Number(data.port), password: data.password || undefined };
		if (camera) await window.api.cameras.update(camera.id, payload);
		else await window.api.cameras.create(payload);
		onDone();
	};

	return (
		<form className="modal" onSubmit={save}>
			<h3>{camera ? 'Editar câmera' : 'Nova câmera'}</h3>
			<label>
				Nome
				<input required value={data.name} onChange={(e) => set('name', e.target.value)} />
			</label>
			<label>
				IP
				<input
					required
					value={data.ip}
					onChange={(e) => set('ip', e.target.value)}
					placeholder="192.168.1.84"
				/>
			</label>
			<label>
				Porta RTSP
				<input
					type="number"
					value={data.port}
					onChange={(e) => set('port', e.target.value)}
				/>
			</label>
			<label>
				Caminho
				<input
					value={data.path}
					onChange={(e) => set('path', e.target.value)}
					placeholder="/stream1"
				/>
			</label>
			<label>
				Usuário
				<input
					value={data.username ?? ''}
					onChange={(e) => set('username', e.target.value)}
				/>
			</label>
			<label>
				Senha
				<input
					type="password"
					value={data.password ?? ''}
					placeholder={camera?.hasPassword ? 'Deixe em branco para manter' : ''}
					onChange={(e) => set('password', e.target.value)}
				/>
			</label>
			<div className="actions">
				<button type="button" onClick={onDone}>
					Cancelar
				</button>
				<button type="submit">Salvar</button>
			</div>
		</form>
	);
}
