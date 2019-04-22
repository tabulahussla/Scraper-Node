declare interface IPlugin {
	sites: string[];
	modules: {
		[site: string]: any;
	};
}
declare type PluginHandler = (options: any) => any;
