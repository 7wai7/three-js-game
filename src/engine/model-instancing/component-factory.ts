import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d";
import type { InstanceNode, InstanceNodeMap, SceneRef } from "./config-types";
import ColliderComponent from "../components/collider";
import Object3DComponent from "../components/object";
import RigidBodyComponent from "../components/rigidbody";
import CarComponent from "../components/vehicle/car";
import WheelComponent from "../components/vehicle/wheel";
import type Component from "../ecs/component";
import type World from "../ecs/world";
import type { EntityId } from "../ecs/types";

type ComponentFactoryContext = {
    node: InstanceNode;
    props?: any;
};

export type RuntimeContext = {
    world: World;
    physicsWorld: RAPIER.World;

    entitiesByName: Map<SceneRef, EntityId>;
    nodesByName: InstanceNodeMap;
};

export type CreatedComponent<T> = {
    component: T;

    initialize?(
        component: T,
        ctx: RuntimeContext,
    ): void;
};

type ComponentFactoryItem<
    T extends Component = Component,
> = (
    ctx: ComponentFactoryContext
) => CreatedComponent<T>;

type ComponentTypeMap = {
    Object3DComponent: Object3DComponent;
    RigidBodyComponent: RigidBodyComponent;
    ColliderComponent: ColliderComponent;
    CarComponent: CarComponent;
    WheelComponent: WheelComponent;
};

type ComponentFactory = {
    [K in keyof ComponentTypeMap]:
    ComponentFactoryItem<ComponentTypeMap[K]>;
};

export const COMPONENT_FACTORY: ComponentFactory = {
    Object3DComponent: ({ node }) => ({
        component: new Object3DComponent(node.source),
    }),

    RigidBodyComponent: ({ node }) => {
        if (!node.rigidBody) {
            throw new Error("RigidBody not found");
        }

        return {
            component: new RigidBodyComponent(node.rigidBody)
        };
    },

    ColliderComponent: ({ node }) => {
        if (!node.collider) {
            throw new Error("Collider not found");
        }

        return {
            component: new ColliderComponent(node.collider)
        };
    },

    CarComponent: ({ props }) => ({
        component: new CarComponent(props),

        initialize(component, ctx) {
            for (const entity of ctx.entitiesByName.values()) {
                const wheel =
                    ctx.world.getComponent(
                        entity,
                        WheelComponent,
                    );

                if (!wheel) continue;

                component.wheels.push(entity);
            }
        }
    }),

    WheelComponent: ({ props }) => ({
        component: new WheelComponent(props),

        initialize(component, ctx) {
            const object3dComponent = ctx.world.getComponent(component.entity, Object3DComponent)!;
            const object3d = object3dComponent.object;

            if (!object3d.parent) {
                console.warn(`Wheel ${object3d.name} doesn't have parent object`);
                return;
            }

            const steerPivot = new THREE.Object3D();

            object3d.parent.attach(steerPivot);
            steerPivot.attach(object3d);
            object3d.position.set(0, 0, 0);

            object3dComponent.object = steerPivot;
            component.steerMesh = object3d;
        }
    }),
};
