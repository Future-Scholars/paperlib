export interface IPluginInfo {
	readonly mainFile: string;
	readonly location: string;
	readonly name: string;
	readonly version: string;
	readonly dependencies: { [name: string]: string };
	readonly author: { name: string; email?: string; url?: string};
	readonly description: string;
	readonly homepage?: string;
	readonly manifest_version?: string;
}
