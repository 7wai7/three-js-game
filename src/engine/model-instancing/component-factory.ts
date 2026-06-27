import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d";
import type { InstanceNode, InstanceNodeMap, SceneRef } from "./config-types";
import Collider from "../components/collider";
import Object3D from "../components/object";
import RigidBody from "../components/rigidbody";
import Car from "../components/vehicle/car";
import Wheel from "../components/vehicle/wheel";
import type Component from "../ecs/component";
import type World from "../ecs/world";
import type { EntityId } from "../ecs/types";

export const COMPONENT_FACTORY: ComponentFactory = {
    Object3D: ({ node }) => ({
        component: new Object3D(node.source),
    }),

    RigidBody: ({ node }) => {
        if (!node.rigidBody) {
            throw new Error("RigidBody not found");
        }

        return {
            component: new RigidBody(node.rigidBody)
        };
    },

    Collider: ({ node }) => {
        if (!node.collider) {
            throw new Error("Collider not found");
        }

        return {
            component: new Collider(node.collider)
        };
    },

    Car: ({ props }) => ({
        component: new Car(props),

        initialize(component, ctx) {
            for (const entity of ctx.entitiesByName.values()) {
                const wheel =
                    ctx.world.getComponent(
                        entity,
                        Wheel,
                    );

                if (!wheel) continue;

                component.wheels.push(entity);
            }
        }
    }),

    Wheel: ({ props }) => ({
        component: new Wheel(props),

        initialize(component, ctx) {
            const object3DComponent = ctx.world.getComponent(component.entity, Object3D)!;
            const object3d = object3DComponent.object;

            if (!object3d.parent) {
                console.warn(`Wheel ${object3d.name} doesn't have parent object`);
                return;
            }

            const steerPivot = new THREE.Object3D();

            object3d.parent.attach(steerPivot);
            steerPivot.attach(object3d);
            object3d.position.set(0, 0, 0);

            object3DComponent.object = steerPivot;
            component.steerMesh = object3d;
        }
    }),
};


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
    Object3D: Object3D;
    RigidBody: RigidBody;
    Collider: Collider;
    Car: Car;
    Wheel: Wheel;
};

type ComponentFactory = {
    [K in keyof ComponentTypeMap]:
    ComponentFactoryItem<ComponentTypeMap[K]>;
};