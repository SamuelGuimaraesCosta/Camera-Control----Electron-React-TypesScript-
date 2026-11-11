import { JSX, useCallback, useEffect, useState } from 'react';
import type { Camera } from '../../shared/types';
import Dashboard from './components/Dashboard';
import CamerasPage from './components/CamerasPage';
import './styles.css';

export default function App(): JSX.Element {
	const [tab, setTab] = useState<'dash' | 'cams'>('dash');
	const [cameras, setCameras] = useState<Camera[]>([]);

	const reload = useCallback(async () => setCameras(await window.api.cameras.list()), []);

	useEffect(() => {
		void (async () => {
			setCameras(await window.api.cameras.list());
		})();
	}, []);

	return (
		<div className="app">
			<nav>
				<strong>Monitor de Câmeras</strong>
				<button className={tab === 'dash' ? 'active' : ''} onClick={() => setTab('dash')}>
					Dashboard
				</button>
				<button className={tab === 'cams' ? 'active' : ''} onClick={() => setTab('cams')}>
					Câmeras
				</button>
			</nav>
			<main>
				{tab === 'dash' ? (
					<Dashboard cameras={cameras} />
				) : (
					<CamerasPage cameras={cameras} onChanged={reload} />
				)}
			</main>
		</div>
	);
}
