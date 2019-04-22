declare interface IResource {
	_id: any;
	poolId?: string;
	type: string;
}

declare interface IAccount extends IResource {
	email: string;
	password: string;
	languages?: string[];
	userAgent?: string;
	viewport?: { width: number; height: number };
}

declare interface IProxy extends IResource {
	protocol: "http" | "https" | "socks5" | "socks4";
	username?: string;
	password?: string;
	host: string;
	port: number;
}

declare interface IResourceConfig {
	type: string;
	pools: string[];
}

declare interface ISiteConfig {
	name: string;
	concurrency: number;
	resources: IResourceConfig[];
}

declare interface IAcquiredResources {
	[type: string]: IResource;
}
