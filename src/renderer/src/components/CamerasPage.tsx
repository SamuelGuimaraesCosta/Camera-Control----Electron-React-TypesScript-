import { JSX, useState } from 'react';
import type { Camera, CameraInput } from '../../../shared/types';
import CameraForm from './CameraForm';

type FormState = { camera?: Camera; initial?: Partial<CameraInput> } | null;

export default function CamerasPage({
	cameras,
	onChanged
}: {
	cameras: Camera[];
	onChanged: () => void;
}): JSX.Element {
	const [form, setForm] = useState<FormState>(null);
	const [found, setFound] = useState<string[] | null>(null);
	const [scanning, setScanning] = useState(false);

	const scan = async (): Promise<void> => {
		setScanning(true);
		setFound(await window.api.scan());
		setScanning(false);
	};

	const remove = async (c: Camera): Promise<void> => {
		if (!confirm(`Excluir a câmera "${c.name}"?`)) return;
		await window.api.cameras.remove(c.id);
		onChanged();
	};

	const done = (): void => {
		setForm(null);
		onChanged();
	};

	return (
		<div>
			<div className="toolbar">
				<button onClick={() => setForm({})}>+ Nova câmera</button>
				<button onClick={scan} disabled={scanning}>
					{scanning ? 'Buscando…' : 'Buscar na rede'}
				</button>
			</div>

			{found && (
				<section>
					<h4>Dispositivos com RTSP (porta 554) encontrados</h4>
					{found.length === 0 && <p>Nenhum encontrado.</p>}
					{found.map((ip) => {
						const already = cameras.some((c) => c.ip === ip);
						return (
							<div key={ip} className="row">
								<span>{ip}</span>
								{already ? (
									<em>já cadastrada</em>
								) : (
									<button
										onClick={() =>
											setForm({ initial: { name: `Câmera ${ip}`, ip } })
										}
									>
										Adicionar
									</button>
								)}
							</div>
						);
					})}
				</section>
			)}

			<h4>Câmeras cadastradas</h4>
			{cameras.map((c) => (
				<div key={c.id} className="row">
					<div>
						<strong>{c.name}</strong>
						<div className="muted">
							rtsp://{c.ip}:{c.port}
							{c.path}
						</div>
					</div>
					<div>
						<button onClick={() => setForm({ camera: c })}>Editar</button>
						<button className="danger" onClick={() => remove(c)}>
							Excluir
						</button>
					</div>
				</div>
			))}

			{form && (
				<div className="overlay-modal">
					<CameraForm camera={form.camera} initial={form.initial} onDone={done} />
				</div>
			)}
		</div>
	);
}
