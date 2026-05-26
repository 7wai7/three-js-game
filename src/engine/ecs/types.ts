import type Component from "./component";

export type Point = { x: number, y: number, z: number };

export type EntityId = number;
export type ComponentId = string;

export type ComponentClass<T extends Component> = abstract new (...args: any[]) => T;