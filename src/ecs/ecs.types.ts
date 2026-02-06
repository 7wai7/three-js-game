import type Component from "./components/component";

export type Point = { x: number, y: number, z: number };

export type EntityId = number;
export type ComponentId = string;

export type ComponentClass<T extends Component> = new (...args: any[]) => T;