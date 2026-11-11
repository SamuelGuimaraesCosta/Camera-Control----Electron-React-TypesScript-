export interface CameraInput {
	name: string;
	ip: string;
	port: number;
	path: string; // ex: /stream1
	username?: string;
	password?: string; // só trafega na escrita; nunca volta ao React
}

export interface Camera {
	id: string;
	name: string;
	ip: string;
	port: number;
	path: string;
	username?: string;
	hasPassword: boolean;
}
