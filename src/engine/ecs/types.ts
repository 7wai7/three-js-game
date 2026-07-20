import type System from '../systems/system';
import type Component from './component';

export type EntityId = string;
export type ComponentId = string;

export type ComponentClass<T extends Component> = abstract new (...args: any[]) => T;
export type SystemClass<T extends System> = abstract new (...args: any[]) => T;

export type ComponentInstances<T extends readonly ComponentClass<Component>[]> = {
  [K in keyof T]: T[K] extends ComponentClass<infer C> ? C : never;
};

export type QueryResult<T extends readonly ComponentClass<Component>[]> = [
  EntityId,
  ...ComponentInstances<T>,
];

export type QueryCache = {
  components: ComponentClass<any>[];
  entities: Set<EntityId>;
  dirty: boolean;
};
