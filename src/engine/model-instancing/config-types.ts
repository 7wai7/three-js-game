import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d';
import type Component from '../ecs/component';

export type SceneRef = string;

export type ModelConfig = {
  modelPath: string;

  entities: Record<SceneRef, EntityConfig>;

  joints: JointConfig[];
};

export type EntityConfig = {
  components?: EntityComponentConfig[];
  collider?: ColliderConfig;
};

export type InstanceNode = {
  source: THREE.Object3D;

  rigidBody?: RAPIER.RigidBody;
  collider?: RAPIER.Collider;

  steerPivot?: THREE.Object3D;
};

export type InstanceNodeMap = Map<SceneRef, InstanceNode>;

// COMPONENT TYPES
export type ComponentConstructor<T extends Component = Component> = new (...args: any[]) => T;

type FirstConstructorArg<C extends ComponentConstructor> =
  ConstructorParameters<C> extends [] ? never : ConstructorParameters<C>[0];

export type ComponentProps<C extends ComponentConstructor> = Exclude<
  FirstConstructorArg<C>,
  undefined
>;

type IfEquals<X, Y, A = X, B = never> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? A : B;

type WritableKey<T> = {
  [K in keyof T]-?: IfEquals<{ [Q in K]: T[K] }, { -readonly [Q in K]: T[K] }, K>;
}[keyof T];

type ObjectRefKey<C extends ComponentConstructor> = {
  [K in WritableKey<InstanceType<C>>]-?: NonNullable<InstanceType<C>[K]> extends THREE.Object3D
    ? K
    : never;
}[WritableKey<InstanceType<C>>] &
  string;

export type ComponentObjectRefs<C extends ComponentConstructor> = Partial<
  Record<ObjectRefKey<C>, SceneRef>
>;

type ComponentConfigOptions<C extends ComponentConstructor> = {
  objectRefs?: ComponentObjectRefs<C>;
};

type ComponentConfigArgs<C extends ComponentConstructor> = [ComponentProps<C>] extends [never]
  ? [props?: never, options?: ComponentConfigOptions<C>]
  : undefined extends FirstConstructorArg<C>
    ? [props?: ComponentProps<C>, options?: ComponentConfigOptions<C>]
    : [props: ComponentProps<C>, options?: ComponentConfigOptions<C>];

export type EntityComponentConfig<C extends ComponentConstructor = ComponentConstructor> = {
  type: C;
  props?: ComponentProps<C>;
  objectRefs?: ComponentObjectRefs<C>;
};

export function component<C extends ComponentConstructor>(
  type: C,
  ...args: ComponentConfigArgs<C>
): EntityComponentConfig<C> {
  const [props, options] = args as [
    ComponentProps<C> | undefined,
    ComponentConfigOptions<C> | undefined,
  ];

  return {
    type,
    ...(props === undefined ? {} : { props }),
    ...options,
  };
}

// COLLIDER TYPES
export type ColliderConfig = {
  source: SceneRef;
  shape?: ColliderShape;
  rigidBodyType?: RigidBodyType;
  axis?: Axis;
  mass?: number;
  collisionGroups?: number;
  enableCcd?: boolean;
  friction?: number;
  frictionRule?: RAPIER.CoefficientCombineRule;
};

// JOINT TYPES
type JointConfig =
  PrismaticJointConfig | RevoluteJointConfig | FixedJointConfig | SphericalJointConfig;

export type PrismaticJointConfig = {
  type: 'prismatic';
  bodyA: SceneRef;
  bodyB: SceneRef;
  axis: JointAxis;
  limits?: {
    min: number;
    max: number;
  };
  motorPosition?: {
    target: number;
    stiffness: number;
    damping: number;
  };
};

export type RevoluteJointConfig = {
  type: 'revolute';
  bodyA: SceneRef;
  bodyB: SceneRef;
  anchor: SceneRef;
  axis: JointAxis;
  limits?: {
    min: number;
    max: number;
  };
  motorVelocity?: {
    target: number;
    force: number;
  };
  motorPosition?: {
    target: number;
    stiffness: number;
    damping: number;
  };
};

export type FixedJointConfig = {
  type: 'fixed';
  bodyA: SceneRef;
  bodyB: SceneRef;
};

export type SphericalJointConfig = {
  type: 'spherical';
  bodyA: SceneRef;
  bodyB: SceneRef;
};

export const COLLIDER_SHAPE = ['BOX', 'BALL', 'CAPSULE', 'CYLINDER'] as const;
export type ColliderShape = (typeof COLLIDER_SHAPE)[number];

export const RIGIDBODY_TYPE = ['FIXED', 'DYNAMIC', 'KINEMATIC'] as const;
export type RigidBodyType = (typeof RIGIDBODY_TYPE)[number];

export const AXIS = ['X', 'Y', 'Z'] as const;
export type Axis = (typeof AXIS)[number];

type JointAxis = {
  x?: -1 | 0 | 1;
  y?: -1 | 0 | 1;
  z?: -1 | 0 | 1;
};
