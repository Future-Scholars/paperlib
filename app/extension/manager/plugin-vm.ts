import * as console from "console";
import Debug from "debug";
import * as fs from "fs-extra";
import * as path from "path";
import * as vm from "vm";
import { PluginManager, PluginSandbox } from "./manager";
import { IPluginInfo } from "./plugin-info";
const debug = Debug("live-plugin-manager.PluginVm");

const SCOPED_REGEX = /^(@[a-zA-Z0-9-_]+\/[a-zA-Z0-9-_]+)(.*)/;

type NodeJSGlobal = typeof global;

export class PluginVm {
  private requireCache = new Map<IPluginInfo, Map<string, NodeModule>>();
  private sandboxCache = new Map<IPluginInfo, NodeJSGlobal>();

  constructor(private readonly manager: PluginManager) {}

  unload(pluginContext: IPluginInfo): void {
    this.requireCache.delete(pluginContext);
    this.sandboxCache.delete(pluginContext);
  }

  load(pluginContext: IPluginInfo, filePath: string): any {
    let moduleInstance = this.getCache(pluginContext, filePath);
    if (moduleInstance) {
      if (debug.enabled) {
        debug(`${filePath} loaded from cache`);
      }
      return moduleInstance.exports;
    }

    if (debug.enabled) {
      debug(`Loading ${filePath} ...`);
    }

    const sandbox = this.createModuleSandbox(pluginContext, filePath);
    moduleInstance = sandbox.module;

    const filePathExtension = path.extname(filePath).toLowerCase();
    if (filePathExtension === ".js" || filePathExtension === ".cjs") {
      const code = fs.readFileSync(filePath, "utf8");
      // note: I first put the object (before executing the script) in cache to support circular require
      this.setCache(pluginContext, filePath, moduleInstance);

      try {
        this.vmRunScriptInSandbox(sandbox, filePath, code);
      } catch (e) {
        // in case of error remove the cache
        this.removeCache(pluginContext, filePath);
        throw e;
      }
    } else if (filePathExtension === ".json") {
      sandbox.module.exports = fs.readJsonSync(filePath);
      this.setCache(pluginContext, filePath, moduleInstance);
    } else {
      throw new Error("Invalid javascript file " + filePath);
    }

    moduleInstance.loaded = true;

    return moduleInstance.exports;
  }

  resolve(pluginContext: IPluginInfo, filePath: string): string {
    return this.sandboxResolve(pluginContext, pluginContext.location, filePath);
  }

  runScript(code: string): any {
    const name = "dynamic-" + Date.now;
    const filePath = path.join(this.manager.options.pluginsPath, name + ".js");
    const pluginContext: IPluginInfo = {
      location: path.join(this.manager.options.pluginsPath, name),
      mainFile: filePath,
      name,
      version: "1.0.0",
      dependencies: {},
      author: { name: "" },
      description: "",
      homepage: "",
    };

    try {
      return this.vmRunScriptInPlugin(pluginContext, filePath, code);
    } finally {
      this.unload(pluginContext);
    }
  }

  splitRequire(fullName: string) {
    const scopedInfo = this.getScopedInfo(fullName);
    if (scopedInfo) {
      return scopedInfo;
    }

    const slashPosition = fullName.indexOf("/");
    let requiredPath: string | undefined;
    let pluginName = fullName;
    if (slashPosition > 0) {
      pluginName = fullName.substring(0, slashPosition);
      requiredPath = "." + fullName.substring(slashPosition);
    }

    return { pluginName, requiredPath };
  }

  private getScopedInfo(fullName: string) {
    const match = SCOPED_REGEX.exec(fullName);
    if (!match) {
      return undefined;
    }

    const requiredPath = match[2] ? "." + match[2] : undefined;

    return {
      pluginName: match[1],
      requiredPath,
    };
  }

  private vmRunScriptInSandbox(
    moduleSandbox: ModuleSandbox,
    filePath: string,
    code: string
  ): void {
    const moduleContext = vm.createContext(moduleSandbox);

    // For performance reasons wrap code in a Immediately-invoked function expression
    // https://60devs.com/executing-js-code-with-nodes-vm-module.html
    // I have also declared the exports variable to support the
    //  `var app = exports = module.exports = {};` notation
    const iifeCode = `
			(function(exports){
        globalThis.AbortController = globalThis['_AC'];
        globalThis.AbortSignal = globalThis['_AS'];
				${code}
			}(module.exports));`;

    const vmOptions = { displayErrors: true, filename: filePath };
    const script = new vm.Script(iifeCode, vmOptions);

    moduleContext._AC = AbortController;
    moduleContext.global._AC = AbortController;
    moduleContext._AS = AbortSignal;
    moduleContext.global._AS = AbortSignal;
    script.runInContext(moduleContext, vmOptions);
  }

  private vmRunScriptInPlugin(
    pluginContext: IPluginInfo,
    filePath: string,
    code: string
  ): any {
    const sandbox = this.createModuleSandbox(pluginContext, filePath);

    this.vmRunScriptInSandbox(sandbox, filePath, code);

    sandbox.module.loaded = true;

    return sandbox.module.exports;
  }

  private getCache(
    pluginContext: IPluginInfo,
    filePath: string
  ): NodeModule | undefined {
    const moduleCache = this.requireCache.get(pluginContext);
    if (!moduleCache) {
      return undefined;
    }

    return moduleCache.get(filePath);
  }

  private setCache(
    pluginContext: IPluginInfo,
    filePath: string,
    instance: NodeModule
  ): void {
    let moduleCache = this.requireCache.get(pluginContext);
    if (!moduleCache) {
      moduleCache = new Map<string, any>();
      this.requireCache.set(pluginContext, moduleCache);
    }

    moduleCache.set(filePath, instance);
  }

  private removeCache(pluginContext: IPluginInfo, filePath: string): void {
    const moduleCache = this.requireCache.get(pluginContext);
    if (!moduleCache) {
      return;
    }

    moduleCache.delete(filePath);
  }

  private createModuleSandbox(
    pluginContext: IPluginInfo,
    filePath: string
  ): ModuleSandbox {
    const pluginSandbox = this.getPluginSandbox(pluginContext);

    const moduleDirname = path.dirname(filePath);

    const moduleResolve: RequireResolve = Object.assign(
      (id: string) => {
        return this.sandboxResolve(pluginContext, moduleDirname, id);
      },
      {
        paths: (_request: string) => null, // TODO I should I populate this
      }
    );

    const moduleRequire: NodeRequire = Object.assign(
      (requiredName: string) => {
        if (debug.enabled) {
          debug(`Requiring '${requiredName}' from ${filePath}...`);
        }
        return this.sandboxRequire(pluginContext, moduleDirname, requiredName);
      },
      {
        resolve: moduleResolve,
        cache: {}, // TODO This should be correctly populated
        extensions: {} as NodeJS.RequireExtensions,
        main: require.main, // TODO assign the real main or consider main the current module (ie. module)?
      }
    );

    const myModule: NodeModule = {
      exports: {},
      filename: filePath,
      id: filePath,
      loaded: false,
      require: moduleRequire,
      paths: [], // TODO I should I populate this
      parent: module, // TODO I assign parent to the current module...it is correct?
      children: [], // TODO I should populate correctly this list...
      path: moduleDirname,
      isPreloading: false,
    };

    // assign missing https://nodejs.org/api/globals.html
    //  and other "not real global" objects
    const moduleSandbox: ModuleSandbox = {
      ...pluginSandbox,
      module: myModule,
      __dirname: moduleDirname,
      __filename: filePath,
      require: moduleRequire,
    };

    return moduleSandbox;
  }

  private sandboxResolve(
    pluginContext: IPluginInfo,
    moduleDirName: string,
    requiredName: string
  ): string {
    // I try to use a similar logic of https://nodejs.org/api/modules.html#modules_modules

    // is a relative module or absolute path
    if (requiredName.startsWith(".") || path.isAbsolute(requiredName)) {
      const fullPath = path.resolve(moduleDirName, requiredName);

      // for security reason check to not load external files
      if (!fullPath.startsWith(pluginContext.location)) {
        throw new Error("Cannot require a module outside a plugin");
      }

      const isFile = this.tryResolveAsFile(fullPath);
      if (isFile) {
        return isFile;
      }

      const isDirectory = this.tryResolveAsDirectory(fullPath);
      if (isDirectory) {
        return isDirectory;
      }

      throw new Error(
        `Cannot find ${requiredName} in plugin ${pluginContext.name}`
      );
    }

    if (this.isPlugin(requiredName)) {
      return requiredName;
    }

    if (this.manager.options.staticDependencies[requiredName]) {
      return requiredName;
    }

    // this will fail if module is unknown
    if (this.isCoreModule(requiredName)) {
      return requiredName;
    }

    return requiredName;
  }

  private sandboxRequire(
    pluginContext: IPluginInfo,
    moduleDirName: string,
    requiredName: string
  ) {
    // I try to use a similar logic of https://nodejs.org/api/modules.html#modules_modules

    const fullName = this.sandboxResolve(
      pluginContext,
      moduleDirName,
      requiredName
    );

    // is an absolute file or directory that can be loaded
    if (path.isAbsolute(fullName)) {
      if (debug.enabled) {
        debug(`Resolved ${requiredName} as file ${fullName}`);
      }
      return this.load(pluginContext, fullName);
    }

    if (this.manager.options.staticDependencies[requiredName]) {
      if (debug.enabled) {
        debug(`Resolved ${requiredName} as static dependency`);
      }
      return this.manager.options.staticDependencies[requiredName];
    }

    if (this.isPlugin(requiredName)) {
      if (debug.enabled) {
        debug(`Resolved ${requiredName} as plugin`);
      }
      return this.manager.require(requiredName);
    }

    if (this.isCoreModule(requiredName)) {
      if (debug.enabled) {
        debug(`Resolved ${requiredName} as core module`);
      }
      return require(requiredName); // I use system require
    }

    if (this.manager.options.hostRequire) {
      if (debug.enabled) {
        debug(`Resolved ${requiredName} as host module`);
      }
      return this.manager.options.hostRequire(requiredName);
    }

    throw new Error(
      `Module ${requiredName} not found, failed to load plugin ${pluginContext.name}`
    );
  }

  private isCoreModule(requiredName: string): boolean {
    return (
      this.manager.options.requireCoreModules &&
      require.resolve(requiredName) === requiredName
    );
  }

  private isPlugin(requiredName: string): boolean {
    const { pluginName } = this.splitRequire(requiredName);

    return !!this.manager.getInfo(pluginName);
  }

  private tryResolveAsFile(fullPath: string): string | undefined {
    const parentPath = path.dirname(fullPath);
    if (checkPath(parentPath) !== "directory") {
      return undefined;
    }

    const reqPathKind = checkPath(fullPath);

    if (reqPathKind !== "file") {
      if (checkPath(fullPath + ".cjs") === "file") {
        return fullPath + ".cjs";
      }

      if (checkPath(fullPath + ".js") === "file") {
        return fullPath + ".js";
      }

      if (checkPath(fullPath + ".json") === "file") {
        return fullPath + ".json";
      }

      return undefined;
    }

    if (reqPathKind === "file") {
      return fullPath;
    }

    return undefined;
  }

  private tryResolveAsDirectory(fullPath: string): string | undefined {
    if (checkPath(fullPath) !== "directory") {
      return undefined;
    }

    const indexCjs = path.join(fullPath, "index.cjs");
    if (checkPath(indexCjs) === "file") {
      return indexCjs;
    }

    const indexJs = path.join(fullPath, "index.js");
    if (checkPath(indexJs) === "file") {
      return indexJs;
    }

    const indexJson = path.join(fullPath, "index.json");
    if (checkPath(indexJson) === "file") {
      return indexJson;
    }

    return undefined;
  }

  private getPluginSandbox(pluginContext: IPluginInfo): NodeJSGlobal {
    let pluginSandbox = this.sandboxCache.get(pluginContext);
    if (!pluginSandbox) {
      const srcSandboxTemplate =
        this.manager.getSandboxTemplate(pluginContext.name) ||
        this.manager.options.sandbox;

      pluginSandbox = this.createGlobalSandbox(srcSandboxTemplate);

      this.sandboxCache.set(pluginContext, pluginSandbox);
    }

    return pluginSandbox;
  }

  private createGlobalSandbox(sandboxTemplate: PluginSandbox): NodeJSGlobal {
    const srcGlobal = sandboxTemplate.global || global;

    const sandbox: NodeJSGlobal = { ...srcGlobal };

    // copy properties that are not copied automatically (don't know why..)
    //  https://stackoverflow.com/questions/59009214/some-properties-of-the-global-instance-are-not-copied-by-spread-operator-or-by-o
    // (some of these properties are Node.js specific, like Buffer)
    // Function and Object should not be defined, otherwise we will have some unexpected behavior
    // Somewhat related to https://github.com/nodejs/node/issues/28823
    if (!sandbox.Buffer && srcGlobal.Buffer) {
      sandbox.Buffer = srcGlobal.Buffer;
    }
    if (!(sandbox as any).URL && global.URL) {
      // cast to any because URL is not defined inside NodeJSGlobal, I don't understand why ...
      (sandbox as any).URL = global.URL;
    }
    if (!(sandbox as any).URLSearchParams && global.URLSearchParams) {
      // cast to any because URLSearchParams is not defined inside NodeJSGlobal, I don't understand why ...
      (sandbox as any).URLSearchParams = global.URLSearchParams;
    }
    if (!sandbox.process && global.process) {
      sandbox.process = { ...global.process };
    }
    if (sandbox.process) {
      // override env to "unlink" from original process
      const srcEnv = sandboxTemplate.env || global.process.env;
      sandbox.process.env = { ...srcEnv }; // copy properties
      (sandbox as any).process.on = (event: string, callback: any) => {};
    }

    // create global console
    if (!sandbox.console) {
      sandbox.console = new console.Console({
        stdout: process.stdout,
        stderr: process.stderr,
      });
    }

    // override the global obj to "unlink" it from the original global obj
    //  and make it unique for each sandbox
    sandbox.global = sandbox;

    return sandbox;
  }
}

function checkPath(fullPath: string): "file" | "directory" | "none" {
  try {
    const stats = fs.statSync(fullPath);
    if (stats.isDirectory()) {
      return "directory";
    } else if (stats.isFile()) {
      return "file";
    } else {
      return "none";
    }
  } catch {
    return "none";
  }
}

interface ModuleSandbox extends NodeJSGlobal {
  module: NodeModule;
  __dirname: string;
  __filename: string;
  require: NodeRequire;
}
