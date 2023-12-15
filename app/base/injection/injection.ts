import { Graph } from "graph-data-structure";

export interface IInjectDependencyConfig {
  dependencyId: string;
  parameterIndex: number;
}

export interface InjectableConstructor<K> {
  new (...args: any[]): K;
  injections?: IInjectDependencyConfig[];
}

export interface IGraph {
  addNode(id: string): void;
  addEdge(id1: string, id2: string): void;
  topologicalSort(): string[];
  hasCycle(): boolean;
}

export function createDecorator(id: string) {
  return function (target: any, propertyKey: any, parameterIndex: number): any {
    const existingInjections = target.injections || [];

    if (existingInjections.length > 0) {
      target.injections!.push({ dependencyId: id, parameterIndex });
    } else {
      Object.defineProperty(target, "injections", {
        enumerable: false,
        configurable: false,
        writable: false,
        value: [...existingInjections, { dependencyId: id, parameterIndex }],
      });
    }
  };
}

export class InjectionContainer {
  private readonly _graph: IGraph;
  private readonly _instances: Map<string, any>;
  private readonly _constructors: Map<string, InjectableConstructor<any>>;

  constructor() {
    this._graph = Graph();
    this._instances = new Map<string, any>();
    this._constructors = new Map<string, InjectableConstructor<any>>();
  }

  public createInstance<T>(constructorsCollection: {
    [key: string]: InjectableConstructor<T>;
  }): { [key: string]: T } {
    for (const id in constructorsCollection) {
      const _constructor = constructorsCollection[id];
      this._constructors.set(id, _constructor);
      this._graph.addNode(id);

      for (const injection of _constructor.injections || []) {
        this._graph.addNode(injection.dependencyId);
        this._graph.addEdge(injection.dependencyId, id);
      }
    }
    if (this._graph.hasCycle()) {
      throw new Error("Cycle dependency");
    }
    const creatSequence = this._graph.topologicalSort();
    console.log(creatSequence.join(" -> "));
    for (const id of creatSequence) {
      const _constructor = this._constructors.get(id);
      if (!_constructor) {
        throw new Error(`No constructor found for ${id}`);
      }
      const injections = (_constructor.injections || []).sort(
        (a, b) => a.parameterIndex - b.parameterIndex
      );
      const args = injections.map((injection) => {
        const instance = this._instances.get(injection.dependencyId);
        if (!instance) {
          throw new Error(`No instance found for ${injection.dependencyId}`);
        }
        return instance;
      });
      this._instances.set(id, new _constructor(...args));
    }
    return Object.fromEntries(this._instances.entries());
  }
}
