import type Component from "./component";

export type DisposableComponent = Component & {
    dispose(): void;
};

export function isDisposableComponent(
    component: Component,
): component is DisposableComponent {
    return typeof (component as Partial<DisposableComponent>).dispose === "function";
}
