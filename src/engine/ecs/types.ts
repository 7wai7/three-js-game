import type System from "../systems/system";
import type Component from "./component";

export type EntityId = string;
export type ComponentId = string;

export type ComponentClass<T extends Component> = abstract new (...args: any[]) => T;
export type SystemClass<T extends System> = abstract new (...args: any[]) => T;

export type QueryCache = {
    components: ComponentClass<any>[];
    entities: Set<EntityId>;
    dirty: boolean;
}