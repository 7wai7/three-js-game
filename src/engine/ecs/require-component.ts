import Component from './component';
import type { ComponentClass, EntityId } from './types';

export type ComponentRequirement = ComponentClass<Component>;
export type ComponentRequirementRef = ComponentRequirement | (() => ComponentRequirement);

const requiredComponents = new WeakMap<object, ComponentRequirementRef[]>();

export class ComponentRequirementError extends Error {
  constructor(
    entity: EntityId,
    componentClass: ComponentClass<Component>,
    missingComponents: ComponentRequirement[],
  ) {
    const missingNames = missingComponents.map((component) => component.name).join(', ');

    super(
      `Component "${componentClass.name}" on entity "${entity}" is missing required component(s): ${missingNames}`,
    );
  }
}

export function RequireComponent(...componentClasses: ComponentRequirementRef[]): ClassDecorator {
  return (target) => {
    const existing = requiredComponents.get(target) ?? [];
    requiredComponents.set(target, uniqueComponentRefs([...existing, ...componentClasses]));
  };
}

export function getRequiredComponents(
  componentClass: ComponentClass<Component>,
): ComponentRequirement[] {
  const requirements: ComponentRequirementRef[] = [];

  let current: object | null = componentClass;
  while (current) {
    requirements.unshift(...(requiredComponents.get(current) ?? []));
    current = Object.getPrototypeOf(current) as object | null;
  }

  return uniqueComponents(requirements.map(resolveRequirement));
}

function uniqueComponents(componentClasses: ComponentRequirement[]) {
  return [...new Set(componentClasses)];
}

function uniqueComponentRefs(componentRefs: ComponentRequirementRef[]) {
  return [...new Set(componentRefs)];
}

function resolveRequirement(componentRef: ComponentRequirementRef) {
  return isComponentClass(componentRef) ? componentRef : componentRef();
}

function isComponentClass(
  componentRef: ComponentRequirementRef,
): componentRef is ComponentRequirement {
  const prototype = (componentRef as { prototype?: unknown }).prototype;
  return prototype instanceof Component;
}
