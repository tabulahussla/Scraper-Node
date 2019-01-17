declare interface WorkerInitOptions {
	_workerInit: true;
	queues: {
		[name: string]: SetupQueueOptions;
	};
}

declare interface Resource {
	_id: any;
	poolId?: string
	type: string;
}

declare interface Account extends Resource {
	email: string;
	password: string;
	languages?: string[];
	userAgent?: string;
	viewport?: { width: number; height: number };
}

declare interface Proxy extends Resource {
	protocol: 'http' | 'https' | 'socks5' | 'socks4';
	username: string;
	password: string;
	host: string;
	port: number;
}

declare interface SetupQueueOptions {
	resources: string[];
	pools: string[];
	workerType: string;
	concurrency: number;
	settings: any;
}
