import { JSX, useEffect, useMemo, useState } from 'react';
import type { Camera } from '../../../shared/types';
import CameraTile from './CameraTile';

const COLUMNS = [1, 2, 3, 4];

export default function Dashboard({ cameras }: { cameras: Camera[] }): JSX.Element {
	const [hidden, setHidden] = useState<string[]>(() => JSON.parse(localStorage.getItem('hiddenCams') ?? '[]'));
	const [cols, setCols] = useState<number>(() => Number(localStorage.getItem('cols') ?? 2));
	const [focusId, setFocusId] = useState<string | null>(null);

	const visible = useMemo(() => cameras.filter((c) => !hidden.includes(c.id)), [cameras, hidden]);

	useEffect(() => {
		localStorage.setItem('hiddenCams', JSON.stringify(hidden));
	}, [hidden]);
	useEffect(() => {
		localStorage.setItem('cols', String(cols));
	}, [cols]);

	const toggle = (id: string): void => setHidden((h) => (h.includes(id) ? h.filter((x) => x !== id) : [...h, id]));

	const focused = visible.find((c) => c.id === focusId);

	return (
		<div>
			<div className="toolbar">
				<div>
					Colunas:{' '}
					{COLUMNS.map((n) => (
						<button key={n} className={cols === n ? 'active' : ''} onClick={() => setCols(n)}>
							{n}
						</button>
					))}
				</div>
				<div className="checks">
					{cameras.map((c) => (
						<label key={c.id}>
							<input type="checkbox" checked={!hidden.includes(c.id)} onChange={() => toggle(c.id)} />
							{c.name}
						</label>
					))}
				</div>
			</div>

			{focused ? (
				<div>
					<CameraTile cam={focused} isFocused onMaximize={() => setFocusId(null)} />
				</div>
			) : (
				<div className="grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
					{visible.map((c) => (
						<CameraTile key={c.id} cam={c} onDoubleClick={() => setFocusId(c.id)} onMaximize={() => setFocusId(c.id)} />
					))}
				</div>
			)}

			{visible.length === 0 && <p>Nenhuma câmera visível. Cadastre em &quot;Câmeras&quot;.</p>}
		</div>
	);
}
