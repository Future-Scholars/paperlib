export interface PackageJsonInfo extends PackageInfo {
	main?: string;
	dependencies?: { [name: string]: string };
	manifest_version?: string;
}

export interface PackageInfo {
	name: string;
	version: string;
	dist?: {
		tarball: string
	};
	author?: string;
	description?: string;
	homepage?: string;
}
