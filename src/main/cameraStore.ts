import { app, safeStorage } from 'electron';
import { join } from 'path';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { randomUUID } from 'crypto';
import type { Camera, CameraInput } from '../shared/types';

type Stored = Omit<Camera, 'hasPassword'> & { passwordEnc?: string };
export type CameraWithSecret = Omit<Camera, 'hasPassword'> & { password?: string };

const FILE = (): string => join(app.getPath('userData'), 'cameras.json');
const load = (): Stored[] => (existsSync(FILE()) ? JSON.parse(readFileSync(FILE(), 'utf8')) : []);
const save = (list: Stored[]): void => writeFileSync(FILE(), JSON.stringify(list, null, 2));

// A senha é criptografada com a proteção do próprio Windows (DPAPI)
const encrypt = (s: string): string => safeStorage.encryptString(s).toString('base64');
const decrypt = (s: string): string => safeStorage.decryptString(Buffer.from(s, 'base64'));

const toPublic = ({ passwordEnc, ...c }: Stored): Camera => ({ ...c, hasPassword: !!passwordEnc });

export const listCameras = (): Camera[] => load().map(toPublic);

export function getCameraWithSecret(id: string): CameraWithSecret {
	const c = load().find((x) => x.id === id);
	if (!c) throw new Error('Câmera não encontrada');
	const { passwordEnc, ...rest } = c;
	return { ...rest, password: passwordEnc ? decrypt(passwordEnc) : undefined };
}

export function createCamera(input: CameraInput): void {
	const list = load();
	const { password, ...rest } = input;
	list.push({ ...rest, id: randomUUID(), passwordEnc: password ? encrypt(password) : undefined });
	save(list);
}

export function updateCamera(id: string, input: Partial<CameraInput>): void {
	const list = load();
	const i = list.findIndex((c) => c.id === id);
	if (i < 0) throw new Error('Câmera não encontrada');
	const { password, ...rest } = input;
	// senha vazia no formulário = manter a atual
	list[i] = {
		...list[i],
		...rest,
		passwordEnc: password ? encrypt(password) : list[i].passwordEnc
	};
	save(list);
}

export function removeCamera(id: string): void {
	save(load().filter((c) => c.id !== id));
}
