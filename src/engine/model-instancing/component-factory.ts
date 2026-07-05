import RAPIER from "@dimforge/rapier3d";
import type { InstanceNode, InstanceNodeMap, SceneRef } from "./config-types";
import Collider from "../components/collider";
import Object3D from "../components/object";
import RigidBody from "../components/rigidbody";
import Car from "../components/vehicle/car";
import type Component from "../ecs/component";
import type World from "../ecs/world";
import type { EntityId } from "../ecs/types";
import Wheel from "../components/vehicle/wheel";

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
                if (
                    !!ctx.world.getComponent(
                        entity,
                        Wheel,
                    )
                ) component.wheels.push(entity);
            }
        }
    }),

    Wheel: ({ props }) => ({
        component: new Wheel(props),

        initialize(component, ctx) {
            const bones = component.bones;

            if (!bones) {
                console.warn("Wheel bones config is missing");
                return;
            }

            component.setBoneObjects({
                base: ctx.nodesByName.get(bones.base)?.source,
                steer: ctx.nodesByName.get(bones.steer)?.source,
                roll: ctx.nodesByName.get(bones.roll)?.source,
            });
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