declare interface WorkerInitOptions {
	_workerInit: true;
	queues: {
		[name: string]: SetupQueueOptions;
	};
}

declare interface Resource {
	_id: any;
	type: string;
}

declare interface Account extends Resource {
	email: string;
	password: string;
}

declare interface Proxy extends Resource {
	host: string;
	port: number;
}

declare interface SetupQueueOptions {
	resources: string[];
	workerType: string;
	concurrency: number;
}
